import {
  PermissionFlagsBits,
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";
import { getUser, createUser, updateUserLogs } from "../../schemas/user.js";
import ms from "ms";
import handleServerLogs from "../../events/serverEvents/handleServerLogs.js";

export default {
  data: new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Timeouts a user")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to timeout")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("duration")
        .setDescription("The duration of the timeout (1m, 1h, 1d)")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("The reason for the timeout")
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
    const duration = interaction.options.getString("duration");
    const reason = interaction.options.getString("reason") || "Not provided";

    if (!duration.match(/^\d+[dhms]$/)) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(
          "Invalid duration format. Use s/m/h/d (e.g. 30s, 5m, 2h, 1d)"
        );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const durationMs = ms(duration);
    if (!durationMs) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription("Invalid duration format");
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    try {
      const member = await interaction.guild.members.fetch(user.id);
      if (!member) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setDescription(`Could not find user <@${user.id}> in this server`);
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      await member.timeout(durationMs, reason);

      await handleServerLogs(
        interaction.client,
        interaction.guild,
        "COMMAND_TIMEOUT",
        {
          target: user,
          executor: interaction.user,
          duration: duration,
          reason: reason,
        }
      );

      let userData = await getUser(user.id, interaction.guildId);
      let timeouts = userData?.timeouts || [];

      timeouts.push({
        reason,
        duration,
        by: interaction.user.id,
        createdAt: Date.now(),
      });

      if (!userData) {
        await createUser(user.id, interaction.guildId, { timeouts });
      } else {
        await updateUserLogs(
          user.id,
          interaction.guildId,
          "timeouts",
          timeouts
        );
      }

      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setDescription(`Timed out <@${user.id}> for ${duration}`);
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("\x1b[31m", `[Error] ${error} at timeout.js`);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(`Failed to timeout user: ${error.message}`);
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
        .setDescription("Please provide a user and duration");
      return message.reply({ embeds: [embed] });
    }

    const userId = args[0].replace(/[<@!>]/g, "");
    const duration = args[1];
    const reason = args.slice(2).join(" ") || "Not provided";

    if (!duration.match(/^\d+[dhms]$/)) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(
          "Invalid duration format. Use s/m/h/d (e.g. 30s, 5m, 2h, 1d)"
        );
      return message.reply({ embeds: [embed] });
    }

    const durationMs = ms(duration);
    if (!durationMs) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription("Invalid duration format");
      return message.reply({ embeds: [embed] });
    }

    try {
      const member = await message.guild.members
        .fetch(userId)
        .catch(() => null);
      if (!member) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setDescription(`Could not find user <@${userId}> in this server`);
        return message.reply({ embeds: [embed] });
      }

      await member.timeout(durationMs, reason);

      await handleServerLogs(message.client, message.guild, "COMMAND_TIMEOUT", {
        target: member.user,
        executor: message.author,
        duration: duration,
        reason: reason,
      });

      let userData = await getUser(userId, message.guildId);
      let timeouts = userData?.timeouts || [];

      timeouts.push({
        reason,
        duration,
        by: message.author.id,
        createdAt: Date.now(),
      });

      if (!userData) {
        await createUser(userId, message.guildId, { timeouts });
      } else {
        await updateUserLogs(userId, message.guildId, "timeouts", timeouts);
      }

      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setDescription(`Timed out <@${userId}> for ${duration}`);
      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error("\x1b[31m", `[Error] ${error} at timeout.js`);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(`Failed to timeout user: ${error.message}`);
      await message.reply({ embeds: [embed] });
    }
  },
};
