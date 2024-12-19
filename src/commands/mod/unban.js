import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { getUser, createUser, updateUserLogs } from "../../schemas/user.js";

export default {
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unbans a user")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to unban")
        .setRequired(true)
    )
    .setIntegrationTypes([0, 1])
    .setContexts([0, 1]),

  async execute(interaction) {
    if (!interaction.member.permissions.has([PermissionFlagsBits.BanMembers]))
      return await interaction.reply({
        content: "You don't have permission to use this command",
        ephemeral: true,
      });

    const user = interaction.options.getUser("user");

    try {
      for (const guildID of process.env.GUILDS.split(",")) {
        const guild = await interaction.client.guilds.cache.get(guildID);
        await guild.members.unban(user);

        let userData = await getUser(user.id, guildID);
        let bans = userData?.bans || [];

        bans.push({
          reason: "Unbanned",
          by: interaction.user.id,
          createdAt: Date.now(),
          type: "unban",
        });

        if (!userData) {
          await createUser(user.id, guildID, { bans });
        } else {
          await updateUserLogs(user.id, guildID, "bans", bans);
        }
      }

      await interaction.reply(`Unbanned <@${user.id}>`);
    } catch (error) {
      console.error(error);
      await interaction.reply({
        content: "An error occurred while unbanning the user",
        ephemeral: true,
      });
    }
  },
};
