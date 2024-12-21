import { getGuildSettings } from "../../utils/dbManager.js";
import handleServerLogs from "../serverEvents/handleServerLogs.js";

const messageCache = new Map();
const raidCache = new Map();
const RAID_COOLDOWN = 60000;

export default async (client, message) => {
  if (message.author.bot || !message.guild) return;

  try {
    const settings = await getGuildSettings(message.guild.id);
    if (!settings?.antiraid_enabled || !settings?.antiraid_jail_channel) return;

    const threshold = settings.antiraid_msg_threshold || 5;
    const timeWindow = (settings.antiraid_time_window || 5) * 1000;

    const guildCache = messageCache.get(message.guild.id) || new Map();
    const userMessages = guildCache.get(message.author.id) || [];
    const now = Date.now();

    userMessages.push(now);
    userMessages.sort((a, b) => b - a);

    while (
      userMessages.length > 0 &&
      now - userMessages[userMessages.length - 1] > timeWindow
    ) {
      userMessages.pop();
    }

    guildCache.set(message.author.id, userMessages);
    messageCache.set(message.guild.id, guildCache);

    const activeRaid = raidCache.get(message.guild.id);
    if (activeRaid && now - activeRaid < RAID_COOLDOWN) return;

    const suspiciousUsers = new Map();
    for (const [userId, timestamps] of guildCache.entries()) {
      if (timestamps.length >= threshold) {
        suspiciousUsers.set(userId, timestamps.length);
      }
    }

    if (suspiciousUsers.size >= 3) {
      raidCache.set(message.guild.id, now);
      const members = await Promise.all(
        Array.from(suspiciousUsers.keys()).map((id) =>
          message.guild.members.fetch(id).catch(() => null)
        )
      );

      const validMembers = members.filter((m) => m && m.moderatable);
      if (validMembers.length > 0) {
        let jailRole = message.guild.roles.cache.find(
          (role) => role.name === "Jailed"
        );
        if (!jailRole) {
          jailRole = await message.guild.roles.create({
            name: "Jailed",
            color: "#36393f",
            permissions: [],
          });
        }

        const jailChannel = await client.channels.fetch(
          settings.antiraid_jail_channel
        );
        const parentCategory = jailChannel.parent;

        for (const member of validMembers) {
          const userRoles = member.roles.cache.filter(
            (role) => role.id !== message.guild.id
          );
          const removedRoles = [];

          for (const role of userRoles.values()) {
            removedRoles.push(role.id);
            await member.roles.remove(role);
          }

          await member.roles.add(jailRole);
        }

        for (const channel of message.guild.channels.cache.values()) {
          if (channel.id === jailChannel.id) {
            await channel.permissionOverwrites.create(jailRole, {
              ViewChannel: true,
              SendMessages: true,
              ReadMessageHistory: true,
            });
          } else if (channel.id === parentCategory?.id) {
            await channel.permissionOverwrites.create(jailRole, {
              ViewChannel: true,
            });
          } else {
            await channel.permissionOverwrites.create(jailRole, {
              ViewChannel: false,
            });
          }
        }

        await handleServerLogs(client, message.guild, "RAID_DETECTED", {
          users: validMembers.map((m) => ({
            id: m.id,
            tag: m.user.tag,
            messageCount: suspiciousUsers.get(m.id),
          })),
          channel: message.channel,
          timeWindow: timeWindow / 1000,
          action: "jailed",
        });

        messageCache.delete(message.guild.id);
      }
    }
  } catch (error) {
    console.error("[Error] Anti-raid handler failed:", error);
  }
};
