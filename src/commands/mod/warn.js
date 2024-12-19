import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { getUser, createUser, updateUserWarns } from "../../schemas/user.js";

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
      let userData = await getUser(user.id);
      let warns = userData?.warns || [];

      warns.push({
        reason: interaction.options.getString("reason") || "Not provided",
        by: interaction.user.id,
        createdAt: Date.now(),
      });

      if (!userData) {
        await createUser(user.id, warns);
      } else {
        await updateUserWarns(user.id, warns);
      }

      interaction.reply({
        content: `Warned ${interaction.options.getUser("user")}`,
      });
    } catch (error) {
      console.log("\x1b[31m", `[Error] ${error} at warn.js`);
    }
  },
};
