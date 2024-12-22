import {
  PermissionFlagsBits,
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";
import { getUser, createUser, updateUserLogs } from "../../schemas/user.js";
import handleServerLogs from "../../events/serverEvents/handleServerLogs.js";

export default {
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Warns a user")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to warn")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("The reason for the warning")
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

    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason") || "Not provided";

    try {
      const member = await interaction.guild.members.fetch(user.id);
      if (!member) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setDescription(`Could not find user <@${user.id}> in this server`);
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      await handleServerLogs(
        interaction.client,
        interaction.guild,
        "COMMAND_WARN",
        {
          target: user,
          executor: interaction.user,
          reason: reason,
        }
      );

      let userData = await getUser(user.id, interaction.guildId);
      let warns = userData?.warns || [];

      warns.push({
        reason,
        by: interaction.user.id,
        createdAt: Date.now(),
      });

      if (!userData) {
        await createUser(user.id, interaction.guildId, { warns });
      } else {
        await updateUserLogs(user.id, interaction.guildId, "warns", warns);
      }

      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setDescription(`Warned <@${user.id}> for: ${reason}`);
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("\x1b[31m", `[Error] ${error} at warn.js`);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(`Failed to warn user: ${error.message}`);
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

    if (!args.length) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription("Please provide a user");
      return message.reply({ embeds: [embed] });
    }

    const userId = args[0].replace(/[<@!>]/g, "");
    const reason = args.slice(1).join(" ") || "Not provided";

    try {
      const member = await message.guild.members
        .fetch(userId)
        .catch(() => null);
      if (!member) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setDescription(
            `Could not find user with ID ${userId} in this server`
          );
        return message.reply({ embeds: [embed] });
      }

      await handleServerLogs(message.client, message.guild, "COMMAND_WARN", {
        target: member.user,
        executor: message.author,
        reason: reason,
      });

      let userData = await getUser(userId, message.guildId);
      let warns = userData?.warns || [];

      warns.push({
        reason,
        by: message.author.id,
        createdAt: Date.now(),
      });

      if (!userData) {
        await createUser(userId, message.guildId, { warns });
      } else {
        await updateUserLogs(userId, message.guildId, "warns", warns);
      }

      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setDescription(`Warned <@${userId}> for: ${reason}`);
      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error("\x1b[31m", `[Error] ${error} at warn.js`);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(`Failed to warn user: ${error.message}`);
      await message.reply({ embeds: [embed] });
    }
  },
};
