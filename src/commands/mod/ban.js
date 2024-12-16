import { PermissionFlagsBits, SlashCommandBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Bans a user")
    .addUserOption((option) =>
      option.setName("user").setDescription("The user to ban").setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("reason")
        .setDescription("The reason for the ban")
        .setRequired(false)
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

    for (const guildID of process.env.GUILDS.split(",")) {
      console.log(guildID);
      const guild = await interaction.client.guilds.cache.get(guildID);

      await guild.members.ban(user, {
        reason: interaction.options.getString("reason") || "Not provided",
      });
    }

    await interaction.reply(`Banned ${user.tag}`);
  },
};
