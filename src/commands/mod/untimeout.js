import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { getUser, createUser, updateUserLogs } from "../../schemas/user.js";

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
    )
      return await interaction.reply({
        content: "You don't have permission to use this command",
        ephemeral: true,
      });

    try {
      const user = interaction.options.getMember("user");

      const guild = interaction.guild;
      const member = await guild.members.fetch(user.id);

      if (!member) {
        return await interaction.reply({
          content: "User not found in this server",
          ephemeral: true,
        });
      }

      await member.timeout(null);

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

      await interaction.reply(`Removed timeout from <@${user.id}>`);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "An error occurred while removing the timeout",
        ephemeral: true,
      });
    }
  },
};
