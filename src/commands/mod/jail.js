import {
  PermissionFlagsBits,
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";
import { getUser, createUser, updateUserLogs } from "../../schemas/user.js";
import { saveUserRoles } from "../../utils/dbManager.js";
import handleServerLogs from "../../events/serverEvents/handleServerLogs.js";

export default {
  data: new SlashCommandBuilder()
    .setName("jail")
    .setDescription("Jails a user")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to jail")
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("The jail channel")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("duration")
        .setDescription("The duration of the jail (e.g. 1d, 2h, 3m)")
        .setRequired(false)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("The reason for jailing")
        .setRequired(false)
    )
    .setIntegrationTypes([0, 1])
    .setContexts([0, 1]),

  async execute(interaction) {
    if (
      !interaction.member.permissions.has([PermissionFlagsBits.ModerateMembers])
    ) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription("You don't have permission to use this command");
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    try {
      const targetUser = interaction.options.getUser("user");
      const reason = interaction.options.getString("reason") || "Not provided";
      const duration = interaction.options.getString("duration");
      const jailChannel = interaction.options.getChannel("channel");
      const parentCategory = jailChannel.parent;

      const member = await interaction.guild.members.fetch(targetUser.id);
      if (!member) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setDescription(
            `Could not find user ${targetUser.tag} in this server`
          );
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      if (member.roles.cache.some((role) => role.name === "Jailed")) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setDescription(
            `Unable to jail ${member} as they are currently jailed`
          );
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      let jailRole = interaction.guild.roles.cache.find(
        (role) => role.name === "Jailed"
      );

      if (!jailRole) {
        jailRole = await interaction.guild.roles.create({
          name: "Jailed",
          color: "#36393f",
          permissions: [],
        });
      }

      const userRoles = member.roles.cache.filter(
        (role) => role.id !== interaction.guild.id
      );
      const removedRoles = [];

      for (const role of userRoles) {
        removedRoles.push(role.id);
        await member.roles.remove(role);
      }

      await saveUserRoles(member.id, interaction.guildId, removedRoles);
      await member.roles.add(jailRole);

      for (const channel of interaction.guild.channels.cache.values()) {
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

      let userData = await getUser(targetUser.id, interaction.guildId);
      let jails = userData?.jails || [];

      jails.push({
        reason,
        duration: duration || "Permanent",
        by: interaction.user.id,
        createdAt: Date.now(),
        removedRoles,
      });

      if (!userData) {
        await createUser(targetUser.id, interaction.guildId, { jails });
      } else {
        await updateUserLogs(
          targetUser.id,
          interaction.guildId,
          "jails",
          jails
        );
      }

      await handleServerLogs(
        interaction.client,
        interaction.guild,
        "COMMAND_JAIL",
        {
          target: targetUser,
          executor: interaction.user,
          duration: duration || "Permanent",
          reason,
        }
      );

      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setDescription(
          `Jailed ${member} ${duration ? `for ${duration}` : "permanently"}`
        );
      await interaction.reply({ embeds: [embed] });

      if (duration) {
        const time = duration
          .replace("d", " * 24 * 60 * 60 * 1000")
          .replace("h", " * 60 * 60 * 1000")
          .replace("m", " * 60 * 1000")
          .replace("s", " * 1000");

        setTimeout(async () => {
          const currentMember = await interaction.guild.members
            .fetch(targetUser.id)
            .catch(() => null);
          if (currentMember) {
            await currentMember.roles.remove(jailRole);
            for (const roleId of removedRoles) {
              await currentMember.roles.add(roleId).catch(() => null);
            }
          }
        }, eval(time));
      }
    } catch (error) {
      console.error("\x1b[31m", `[Error] ${error} at jail.js`);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(`Failed to jail user: ${error.message}`);
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },

  async prefixExecute(message, args) {
    if (
      !message.member.permissions.has([PermissionFlagsBits.ModerateMembers])
    ) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription("You don't have permission to use this command");
      return message.reply({ embeds: [embed] });
    }

    if (args.length < 2) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription("Please provide a user and jail channel");
      return message.reply({ embeds: [embed] });
    }

    const userId = args[0].replace(/[<@!>]/g, "");
    const channelId = args[1].replace(/[<#>]/g, "");
    const duration = args[2];
    const reason = args.slice(3).join(" ") || "Not provided";

    try {
      const targetUser = await message.client.users.fetch(userId);
      const member = await message.guild.members.fetch(userId);
      const jailChannel = await message.guild.channels.fetch(channelId);
      const parentCategory = jailChannel.parent;

      if (!member) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setDescription(
            `Could not find user with ID ${userId} in this server`
          );
        return message.reply({ embeds: [embed] });
      }

      if (member.roles.cache.some((role) => role.name === "Jailed")) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setDescription(
            `Unable to jail ${member} as they are currently jailed`
          );
        return message.reply({ embeds: [embed] });
      }

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

      const userRoles = member.roles.cache.filter(
        (role) => role.id !== message.guild.id
      );
      const removedRoles = [];

      for (const role of userRoles) {
        removedRoles.push(role.id);
        await member.roles.remove(role);
      }

      await saveUserRoles(member.id, message.guildId, removedRoles);
      await member.roles.add(jailRole);

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

      let userData = await getUser(targetUser.id, message.guildId);
      let jails = userData?.jails || [];

      jails.push({
        reason,
        duration: duration || "Permanent",
        by: message.author.id,
        createdAt: Date.now(),
        removedRoles,
      });

      if (!userData) {
        await createUser(targetUser.id, message.guildId, { jails });
      } else {
        await updateUserLogs(targetUser.id, message.guildId, "jails", jails);
      }

      await handleServerLogs(message.client, message.guild, "COMMAND_JAIL", {
        target: targetUser,
        executor: message.author,
        duration: duration || "Permanent",
        reason,
      });

      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setDescription(
          `Jailed ${member} ${duration ? `for ${duration}` : "permanently"}`
        );
      await message.reply({ embeds: [embed] });

      if (duration) {
        const time = duration
          .replace("d", " * 24 * 60 * 60 * 1000")
          .replace("h", " * 60 * 60 * 1000")
          .replace("m", " * 60 * 1000")
          .replace("s", " * 1000");

        setTimeout(async () => {
          const currentMember = await message.guild.members
            .fetch(targetUser.id)
            .catch(() => null);
          if (currentMember) {
            await currentMember.roles.remove(jailRole);
            for (const roleId of removedRoles) {
              await currentMember.roles.add(roleId).catch(() => null);
            }
          }
        }, eval(time));
      }
    } catch (error) {
      console.error("\x1b[31m", `[Error] ${error} at jail.js`);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(`Failed to jail user: ${error.message}`);
      await message.reply({ embeds: [embed] });
    }
  },
};
