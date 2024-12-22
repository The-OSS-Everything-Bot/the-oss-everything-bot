import {
  EmbedBuilder,
  SlashCommandBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { getUser } from "../../schemas/user.js";
import handleServerLogs from "../../events/serverEvents/handleServerLogs.js";

export default {
  data: new SlashCommandBuilder()
    .setName("logs")
    .setDescription("Gets the moderation logs for a user")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to get logs for")
        .setRequired(true)
    )
    .setIntegrationTypes([0])
    .setContexts([0]),

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
    const guildId = interaction.guildId;

    try {
      const userData = await getUser(user.id, guildId);

      if (!userData) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setDescription(`No moderation logs found for <@${user.id}>`);
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const hasLogs = Object.values(userData).some(
        (logs) => Array.isArray(logs) && logs.length > 0
      );

      if (!hasLogs) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setDescription(`No moderation logs found for <@${user.id}>`);
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setTitle(`Moderation Logs for <@${user.id}>`)
        .setAuthor({
          name: `ID: ${user.id}`,
          iconURL: user.displayAvatarURL(),
        })
        .setFooter({
          text: interaction.user.tag,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setColor(0x3498db);

      const addLogsToEmbed = (actionType, logs) => {
        if (!logs?.length) return;

        const chunks = [];
        let currentChunk = [];
        let currentLength = 0;

        logs.forEach((log) => {
          const logEntry = `**By:** <@${log.by}>\n**Reason:** ${log.reason}\n**Date:** ${new Date(log.createdAt).toLocaleString()}\n\n`;

          if (currentLength + logEntry.length > 1000) {
            chunks.push(currentChunk.join(""));
            currentChunk = [logEntry];
            currentLength = logEntry.length;
          } else {
            currentChunk.push(logEntry);
            currentLength += logEntry.length;
          }
        });

        if (currentChunk.length) {
          chunks.push(currentChunk.join(""));
        }

        chunks.forEach((chunk, index) => {
          embed.addFields({
            name:
              index === 0
                ? actionType.charAt(0).toUpperCase() + actionType.slice(1)
                : `${actionType} (continued)`,
            value: chunk,
          });
        });
      };

      ["warns", "bans", "kicks", "timeouts", "jails"].forEach((actionType) => {
        addLogsToEmbed(actionType, userData[actionType]);
      });

      await handleServerLogs(
        interaction.client,
        interaction.guild,
        "COMMAND_LOGS",
        {
          target: user,
          executor: interaction.user,
        }
      );

      return interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("\x1b[31m", `[Error] ${error} at logs.js`);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(`Failed to fetch logs: ${error.message}`);
      return interaction.reply({ embeds: [embed], ephemeral: true });
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

    const userId = args[0]?.replace(/[<@!>]/g, "");
    if (!userId) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription("Please provide a user to check logs for");
      return message.reply({ embeds: [embed] });
    }

    try {
      const user = await message.client.users.fetch(userId);
      const userData = await getUser(user.id, message.guildId);

      if (!userData) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setDescription(`No moderation logs found for <@${user.id}>`);
        return message.reply({ embeds: [embed] });
      }

      const hasLogs = Object.values(userData).some(
        (logs) => Array.isArray(logs) && logs.length > 0
      );

      if (!hasLogs) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setDescription(`No moderation logs found for <@${user.id}>`);
        return message.reply({ embeds: [embed] });
      }

      const embed = new EmbedBuilder()
        .setTitle(`Moderation Logs for <@${user.id}>`)
        .setAuthor({
          name: `ID: ${user.id}`,
          iconURL: user.displayAvatarURL(),
        })
        .setFooter({
          text: message.author.tag,
          iconURL: message.author.displayAvatarURL(),
        })
        .setColor(0x3498db);

      const addLogsToEmbed = (actionType, logs) => {
        if (!logs?.length) return;

        const chunks = [];
        let currentChunk = [];
        let currentLength = 0;

        logs.forEach((log) => {
          const logEntry = `**By:** <@${log.by}>\n**Reason:** ${log.reason}\n**Date:** ${new Date(log.createdAt).toLocaleString()}\n\n`;

          if (currentLength + logEntry.length > 1000) {
            chunks.push(currentChunk.join(""));
            currentChunk = [logEntry];
            currentLength = logEntry.length;
          } else {
            currentChunk.push(logEntry);
            currentLength += logEntry.length;
          }
        });

        if (currentChunk.length) {
          chunks.push(currentChunk.join(""));
        }

        chunks.forEach((chunk, index) => {
          embed.addFields({
            name:
              index === 0
                ? actionType.charAt(0).toUpperCase() + actionType.slice(1)
                : `${actionType} (continued)`,
            value: chunk,
          });
        });
      };

      ["warns", "bans", "kicks", "timeouts", "jails"].forEach((actionType) => {
        addLogsToEmbed(actionType, userData[actionType]);
      });

      await handleServerLogs(message.client, message.guild, "COMMAND_LOGS", {
        target: user,
        executor: message.author,
      });

      return message.reply({ embeds: [embed] });
    } catch (error) {
      console.error("\x1b[31m", `[Error] ${error} at logs.js`);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(`Failed to fetch logs: ${error.message}`);
      await message.reply({ embeds: [embed] });
    }
  },
};
