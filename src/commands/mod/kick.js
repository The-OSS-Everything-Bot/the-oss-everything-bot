import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

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
    .setIntegrationTypes([0, 1])
    .setContexts([0, 1]),

  async execute(interaction) {
    if (!interaction.member.permissions.has([PermissionFlagsBits.KickMembers]))
      return await interaction.reply({
        content: "You don't have permission to use this command",
        ephemeral: true,
      });

    const user = interaction.options.getUser("user");

    for (const guildID of process.env.GUILDS.split(",")) {
      console.log(guildID);
      const guild = await interaction.client.guilds.cache.get(guildID);

      await guild.members.kick(user);
    }

    await interaction.reply(`Kicked ${user.tag}`);
  },
};
