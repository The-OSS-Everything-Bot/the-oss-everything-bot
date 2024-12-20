import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { getUser, createUser, updateUserLogs } from "../../schemas/user.js";

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
        .setDescription("The reason for the warn")
        .setRequired(false)
    )
    .setIntegrationTypes([0, 1])
    .setContexts([0, 1]),

  async execute(interaction) {
    if (!interaction.member.permissions.has([PermissionFlagsBits.KickMembers]))
      return await interaction.reply({
        content: "You don't have permission to use this command",
        ephemeral: true,
      });

    try {
      const user = interaction.options.getUser("user");
      const guildId = interaction.guildId;
      let userData = await getUser(user.id, guildId);
      let warns = userData?.warns || [];

      warns.push({
        reason: interaction.options.getString("reason") || "Not provided",
        by: interaction.user.id,
        createdAt: Date.now(),
      });

      if (!userData) {
        await createUser(user.id, guildId, { warns });
      } else {
        await updateUserLogs(user.id, guildId, "warns", warns);
      }

      interaction.reply({
        content: `Warned <@${user.id}>`,
      });
    } catch (error) {
      console.error("\x1b[31m", `[Error] ${error} at warn.js`);
      await interaction.reply({
        content: "An error occurred while warning the user",
        ephemeral: true,
      });
    }
  },

  async prefixExecute(message, args) {
    if (!message.member.permissions.has([PermissionFlagsBits.KickMembers]))
      return message.reply("You don't have permission to use this command");

    const userId = args[0]?.replace(/[<@!>]/g, "");
    if (!userId) return message.reply("Please provide a user to warn");

    const reason = args.slice(1).join(" ") || "Not provided";

    try {
      const user = await message.client.users.fetch(userId);
      let userData = await getUser(user.id, message.guildId);
      let warns = userData?.warns || [];

      warns.push({
        reason,
        by: message.author.id,
        createdAt: Date.now(),
      });

      if (!userData) {
        await createUser(user.id, message.guildId, { warns });
      } else {
        await updateUserLogs(user.id, message.guildId, "warns", warns);
      }

      await message.reply(`Warned <@${user.id}>`);
    } catch (error) {
      console.error("\x1b[31m", `[Error] ${error} at warn.js`);
      await message.reply("An error occurred while warning the user");
    }
  },
};
