import { EmbedBuilder, AuditLogEvent } from "discord.js";
import { getGuildSettings } from "../../utils/dbManager.js";

export default async (client, guild, action) => {
  try {
    const settings = await getGuildSettings(guild.id);
    if (!settings?.log_channel_id) return;

    const logsChannel = await client.channels.fetch(settings.log_channel_id);
    if (!logsChannel) return;

    const auditLogs = await guild.fetchAuditLogs({ limit: 1 });
    const log = auditLogs.entries.first();
    if (!log) return;

    const embed = new EmbedBuilder()
      .setTimestamp()
      .setFooter({ text: `ID: ${log.executor.id}` });

    switch (log.action) {
      case AuditLogEvent.ChannelCreate:
        embed
          .setTitle("Channel Created")
          .setColor(0x57f287)
          .addFields(
            { name: "Channel", value: `${log.target}`, inline: true },
            { name: "Created by", value: `${log.executor}`, inline: true },
            { name: "Type", value: `${log.target.type}`, inline: true }
          );
        break;

      case AuditLogEvent.ChannelDelete:
        embed
          .setTitle("Channel Deleted")
          .setColor(0xed4245)
          .addFields(
            { name: "Channel", value: log.changes[0].old, inline: true },
            { name: "Deleted by", value: `${log.executor}`, inline: true }
          );
        break;

      case AuditLogEvent.RoleCreate:
        embed
          .setTitle("Role Created")
          .setColor(0x57f287)
          .addFields(
            { name: "Role", value: `${log.target}`, inline: true },
            { name: "Created by", value: `${log.executor}`, inline: true }
          );
        break;

      case AuditLogEvent.RoleDelete:
        embed
          .setTitle("Role Deleted")
          .setColor(0xed4245)
          .addFields(
            { name: "Role", value: log.changes[0].old, inline: true },
            { name: "Deleted by", value: `${log.executor}`, inline: true }
          );
        break;

      case AuditLogEvent.MemberKick:
        embed
          .setTitle("Member Kicked")
          .setColor(0xed4245)
          .addFields(
            { name: "Member", value: `${log.target}`, inline: true },
            { name: "Kicked by", value: `${log.executor}`, inline: true },
            {
              name: "Reason",
              value: log.reason || "No reason provided",
              inline: true,
            }
          );
        break;

      case AuditLogEvent.MemberBanAdd:
        embed
          .setTitle("Member Banned")
          .setColor(0xed4245)
          .addFields(
            { name: "Member", value: `${log.target}`, inline: true },
            { name: "Banned by", value: `${log.executor}`, inline: true },
            {
              name: "Reason",
              value: log.reason || "No reason provided",
              inline: true,
            }
          );
        break;

      case AuditLogEvent.MemberBanRemove:
        embed
          .setTitle("Member Unbanned")
          .setColor(0x57f287)
          .addFields(
            { name: "Member", value: `${log.target}`, inline: true },
            { name: "Unbanned by", value: `${log.executor}`, inline: true }
          );
        break;

      case AuditLogEvent.MemberUpdate:
        const changes = log.changes
          .map((c) => `${c.key}: ${c.old} → ${c.new}`)
          .join("\n");
        embed
          .setTitle("Member Updated")
          .setColor(0x3498db)
          .addFields(
            { name: "Member", value: `${log.target}`, inline: true },
            { name: "Updated by", value: `${log.executor}`, inline: true },
            { name: "Changes", value: changes }
          );
        break;
    }

    await logsChannel.send({ embeds: [embed] });
  } catch (error) {
    console.error("[Error] Server logs failed:", error);
  }
};
