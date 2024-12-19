import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { getUser, updateUserLogs } from "../../schemas/user.js";

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
    .setIntegrationTypes([0, 1])
    .setContexts([0, 1]),

  async execute(interaction) {
    if (
      !interaction.member.permissions.has([PermissionFlagsBits.Administrator])
    )
      return await interaction.reply({
        content: "You don't have permission to use this command",
        ephemeral: true,
      });

    const user = interaction.options.getUser("user");

    try {
      for (const guildID of process.env.GUILDS.split(",")) {
        const userData = await getUser(user.id, guildID);
        if (!userData) continue;

        const actions = ["warns", "bans", "kicks", "timeouts", "jails"];
        for (const action of actions) {
          if (userData[action]?.length) {
            await updateUserLogs(user.id, guildID, action, []);
          }
        }
      }

      await interaction.reply(`Cleared all infractions for <@${user.id}>`);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "An error occurred while clearing infractions",
        ephemeral: true,
      });
    }
  },
};
