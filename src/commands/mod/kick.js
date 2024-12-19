import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { getUser, createUser, updateUserLogs } from "../../schemas/user.js";

export default {
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kicks a user")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to kick")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("The reason for the kick")
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

    const user = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason") || "Not provided";

    try {
      for (const guildID of process.env.GUILDS.split(",")) {
        const guild = await interaction.client.guilds.cache.get(guildID);
        await guild.members.kick(user, reason);

        let userData = await getUser(user.id, guildID);
        let kicks = userData?.kicks || [];

        kicks.push({
          reason,
          by: interaction.user.id,
          createdAt: Date.now(),
        });

        if (!userData) {
          await createUser(user.id, guildID, { kicks });
        } else {
          await updateUserLogs(user.id, guildID, "kicks", kicks);
        }
      }

      await interaction.reply(`Kicked ${user.tag}`);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "An error occurred while kicking the user",
        ephemeral: true,
      });
    }
  },
};
