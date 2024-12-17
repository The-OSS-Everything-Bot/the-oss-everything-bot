import {
  EmbedBuilder,
  SlashCommandBuilder,
  ButtonBuilder,
  PermissionFlagsBits,
} from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Setups a ticket system")
    .setIntegrationTypes([0])
    .setContexts([0])
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("The channel to create the ticket in")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    if (
      !interaction.member.permissions.has([PermissionFlagsBits.ManageChannels])
    )
      return await interaction.editReply({
        content: "You don't have permission to use this command",
      });

    const channel = interaction.options.getChannel("channel");

    await channel.send({
      embeds: [
        new EmbedBuilder()
          .setTitle("Ticket")
          .setDescription("Would you like to create new ticket?"),
      ],
      components: [
        {
          type: 1,
          components: [
            new ButtonBuilder()
              .setCustomId(`new ticket`)
              .setLabel("Create ticket")
              .setStyle(3)
              .setEmoji("🎫"),
          ],
        },
      ],
    });

    await interaction.editReply({
      content: "Ticket channel setuped successfully",
      ephemeral: true,
    });
  },
};
