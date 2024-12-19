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

      for (const guildID of process.env.GUILDS.split(",")) {
        const guild = await interaction.client.guilds.cache.get(guildID);
        const member = await guild.members.fetch(user.id);

        if (!member) continue;
        await member.timeout(null);

        let userData = await getUser(user.id, guildID);
        let timeouts = userData?.timeouts || [];

        timeouts.push({
          reason: "Timeout removed",
          by: interaction.user.id,
          createdAt: Date.now(),
          type: "untimeout",
        });

        if (!userData) {
          await createUser(user.id, guildID, { timeouts });
        } else {
          await updateUserLogs(user.id, guildID, "timeouts", timeouts);
        }
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
