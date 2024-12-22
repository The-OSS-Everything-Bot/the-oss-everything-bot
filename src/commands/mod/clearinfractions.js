import {
  PermissionFlagsBits,
  SlashCommandBuilder,
  EmbedBuilder,
} from "discord.js";
import { getUser, updateUserLogs } from "../../schemas/user.js";
import handleServerLogs from "../../events/serverEvents/handleServerLogs.js";

export default {
  data: new SlashCommandBuilder()
    .setName("clearinfractions")
    .setDescription("Clears all infractions for a user")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to clear infractions for")
        .setRequired(true)
    )
    .setIntegrationTypes([0])
    .setContexts([0]),

  async execute(interaction) {
    if (
      !interaction.member.permissions.has([PermissionFlagsBits.Administrator])
    ) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription("You don't have permission to use this command");
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const user = interaction.options.getUser("user");

    try {
      const userData = await getUser(user.id, interaction.guildId);
      if (!userData) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setDescription("No infractions found for this user");
        return interaction.reply({ embeds: [embed], ephemeral: true });
      }

      const actions = ["warns", "bans", "kicks", "timeouts", "jails"];
      for (const action of actions) {
        if (userData[action]?.length) {
          await updateUserLogs(user.id, interaction.guildId, action, []);
        }
      }

      await handleServerLogs(
        interaction.client,
        interaction.guild,
        "COMMAND_CLEARINFRACTIONS",
        {
          target: user,
          executor: interaction.user,
        }
      );

      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setDescription(`Cleared all infractions for <@${user.id}>`);
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error("\x1b[31m", `[Error] ${error} at clearinfractions.js`);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(`Failed to clear infractions: ${error.message}`);
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },

  async prefixExecute(message, args) {
    if (!message.member.permissions.has([PermissionFlagsBits.Administrator])) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription("You don't have permission to use this command");
      return message.reply({ embeds: [embed] });
    }

    const userId = args[0]?.replace(/[<@!>]/g, "");
    if (!userId) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription("Please provide a user to clear infractions for");
      return message.reply({ embeds: [embed] });
    }

    try {
      const user = await message.client.users.fetch(userId);
      const userData = await getUser(user.id, message.guildId);

      if (!userData) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setDescription("No infractions found for this user");
        return message.reply({ embeds: [embed] });
      }

      const actions = ["warns", "bans", "kicks", "timeouts", "jails"];
      for (const action of actions) {
        if (userData[action]?.length) {
          await updateUserLogs(user.id, message.guildId, action, []);
        }
      }

      await handleServerLogs(
        message.client,
        message.guild,
        "COMMAND_CLEARINFRACTIONS",
        {
          target: user,
          executor: message.author,
        }
      );

      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setDescription(`Cleared all infractions for <@${user.id}>`);
      await message.reply({ embeds: [embed] });
    } catch (error) {
      console.error("\x1b[31m", `[Error] ${error} at clearinfractions.js`);
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(`Failed to clear infractions: ${error.message}`);
      await message.reply({ embeds: [embed] });
    }
  },
};
