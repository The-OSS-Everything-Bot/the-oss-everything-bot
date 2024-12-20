import {
  EmbedBuilder,
  SlashCommandBuilder,
  ButtonBuilder,
  PermissionFlagsBits,
} from "discord.js";
import { setGuildTickets } from "../../schemas/guild.js";

export default {
  data: new SlashCommandBuilder()
    .setName("ticket")
    .setDescription("Setups a ticket system")
    .addStringOption((option) =>
      option
        .setName("title")
        .setDescription("The title of the ticket")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("description")
        .setDescription("The description of the ticket")
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("The channel to create the ticket tool in")
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option
        .setName("category")
        .setDescription("The category to create tickets in")
        .setRequired(true)
    ),

  /**
   *
   * @param {import("discord.js").CommandInteraction} interaction
   * @returns
   */
  async execute(interaction) {
    await interaction.deferReply();

    try {
      if (
        !interaction.member.permissions.has([
          PermissionFlagsBits.ManageChannels,
        ])
      ) {
        return await interaction.editReply({
          content: "You don't have permission to use this command",
        });
      }

      const channel = interaction.options.getChannel("channel");
      const category = interaction.options.getChannel("category");
      const title = interaction.options.getString("title");
      const description = interaction.options.getString("description");

      if (category.type !== 4) {
        throw "Category must be a category";
      }

      if (channel.type !== 0) {
        throw "Channel must be a text channel";
      }

      await setGuildTickets(interaction.guild.id, {
        channel: channel.id,
        category: category.id,
      });

      await channel.send({
        embeds: [
          new EmbedBuilder().setTitle(title).setDescription(description),
        ],
        components: [
          {
            type: 1,
            components: [
              new ButtonBuilder()
                .setCustomId(`new ticket`)
                .setLabel("Create ticket")
                .setStyle(1)
                .setEmoji("🎫"),
            ],
          },
        ],
      });

      await interaction.editReply({
        content: "Ticket channel setup successfully",
        ephemeral: true,
      });
    } catch (err) {
      console.error(`[Error] ${err}`);

      if (err.includes("Cannot read properties of null")) {
        return await interaction.editReply({
          content: "Missing inputs",
        });
      }

      if (err.includes("Category must be a category")) {
        return await interaction.editReply({
          content: "Category must be a category",
        });
      }

      if (err.includes("Channel must be a text channel")) {
        return await interaction.editReply({
          content: "Channel must be a text channel",
        });
      }

      await interaction.editReply({
        content: "Something went wrong",
        ephemeral: true,
      });
    }
  },
};
