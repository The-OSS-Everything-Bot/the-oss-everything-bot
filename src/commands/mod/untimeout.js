import {
  PermissionFlagsBits,
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";
import { getUser, createUser, updateUserLogs } from "../../schemas/user.js";
import handleServerLogs from "../../events/serverEvents/handleServerLogs.js";

export default {
  data: new SlashCommandBuilder()
    .setName("untimeout")
    .setDescription("Removes timeout from a user")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to remove timeout from")
        .setRequired(true)
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
      const user = interaction.options.getMember("user");
      const guild = interaction.guild;
      const member = await guild.members.fetch(user.id);

      if (!member) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setDescription(`Could not find user <@${user.id}> in this server`);
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      await member.timeout(null);

      await handleServerLogs(
        interaction.client,
        interaction.guild,
        "COMMAND_TIMEOUT",
        {
          target: user,
          executor: interaction.user,
          duration: "0",
          reason: "Timeout removed",
          type: "untimeout",
        }
      );

      let userData = await getUser(user.id, guild.id);
      let timeouts = userData?.timeouts || [];

      timeouts.push({
        reason: "Timeout removed",
        by: interaction.user.id,
        createdAt: Date.now(),
        type: "untimeout",
      });

      if (!userData) {
        await createUser(user.id, guild.id, { timeouts });
      } else {
        await updateUserLogs(user.id, guild.id, "timeouts", timeouts);
      }

      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setDescription(`Removed timeout from <@${user.id}>`);
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("\x1b[31m", `[Error] ${error} at untimeout.js`);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(`Failed to remove timeout: ${error.message}`);
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

      await member.timeout(null);

      await handleServerLogs(message.client, message.guild, "COMMAND_TIMEOUT", {
        target: member.user,
        executor: message.author,
        duration: "0",
        reason: "Timeout removed",
        type: "untimeout",
      });

      let userData = await getUser(userId, message.guildId);
      let timeouts = userData?.timeouts || [];

      timeouts.push({
        reason: "Timeout removed",
        by: message.author.id,
        createdAt: Date.now(),
        type: "untimeout",
      });

      if (!userData) {
        await createUser(userId, message.guildId, { timeouts });
      } else {
        await updateUserLogs(userId, message.guildId, "timeouts", timeouts);
      }

      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setDescription(`Removed timeout from <@${userId}>`);
      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error("\x1b[31m", `[Error] ${error} at untimeout.js`);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(`Failed to remove timeout: ${error.message}`);
      await message.reply({ embeds: [embed] });
    }
  },
};
