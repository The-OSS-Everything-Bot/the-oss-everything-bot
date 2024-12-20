import {
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
} from "discord.js";
import { SlashCommandBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("search")
    .setDescription("Search the web")
    .addStringOption((option) =>
      option
        .setName("query")
        .setDescription("What to search for")
        .setRequired(true)
    )
    .setIntegrationTypes([0, 1])
    .setContexts([0, 1, 2]),

  async execute(interaction) {
    await interaction.deferReply();

    const query = interaction.options.getString("query");
    const encodedQuery = encodeURIComponent(query);

    try {
      const response = await fetch(
        `https://api.duckduckgo.com/?q=${encodedQuery}&format=json`
      );
      const data = await response.json();

      const results = data.RelatedTopics.filter(
        (topic) => topic.Text && topic.FirstURL
      );
      const pages = Math.ceil(results.length / 3);
      let currentPage = 0;

      const getEmbed = (page) => {
        const start = page * 3;
        const end = start + 3;
        const pageResults = results.slice(start, end);

        return new EmbedBuilder()
          .setTitle("Search Results")
          .setDescription(
            pageResults
              .map(
                (r) =>
                  `**[${r.Text.split(" - ")[0]}](${r.FirstURL})**\n${r.Text.split(" - ")[1] || ""}`
              )
              .join("\n\n")
          )
          .setFooter({
            text: `Page ${page + 1}/${pages} of DuckDuckGo Results`,
            iconURL: interaction.user.displayAvatarURL(),
          })
          .setColor(0x5865f2);
      };

      const getRow = (page) => {
        return new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("prev")
            .setLabel("◀")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === 0),
          new ButtonBuilder()
            .setCustomId("next")
            .setLabel("▶")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === pages - 1)
        );
      };

      const message = await interaction.editReply({
        embeds: [getEmbed(currentPage)],
        components: [getRow(currentPage)],
        fetchReply: true,
      });

      const collector = message.createMessageComponentCollector({
        time: 300000,
      });

      collector.on("collect", async (i) => {
        if (i.user.id !== interaction.user.id) {
          await i.reply({
            content: "Only the command user can navigate pages",
            ephemeral: true,
          });
          return;
        }

        currentPage =
          i.customId === "prev"
            ? Math.max(0, currentPage - 1)
            : Math.min(pages - 1, currentPage + 1);

        await interaction.editReply({
          embeds: [getEmbed(currentPage)],
          components: [getRow(currentPage)],
        });

        await i.deferUpdate().catch(() => null);
      });

      collector.on("end", () => {
        if (!message.editable) return;

        const disabledRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("prev")
            .setLabel("◀")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId("next")
            .setLabel("▶")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true)
        );

        interaction.editReply({ components: [disabledRow] }).catch(() => null);
      });
    } catch (error) {
      console.error("Search error:", error);
      await interaction
        .editReply("An error occurred while searching")
        .catch(() => null);
    }
  },

  async prefixExecute(message, args) {
    if (!args.length) return message.reply("Please provide a search query");

    const query = args.join(" ");
    const encodedQuery = encodeURIComponent(query);

    try {
      const apiResponse = await fetch(
        `https://api.duckduckgo.com/?q=${encodedQuery}&format=json`
      );
      const data = await apiResponse.json();

      const results = data.RelatedTopics.filter(
        (topic) => topic.Text && topic.FirstURL
      );
      const pages = Math.ceil(results.length / 3);
      let currentPage = 0;

      const getEmbed = (page) => {
        const start = page * 3;
        const end = start + 3;
        const pageResults = results.slice(start, end);

        return new EmbedBuilder()
          .setTitle("Search Results")
          .setDescription(
            pageResults
              .map(
                (r) =>
                  `**[${r.Text.split(" - ")[0]}](${r.FirstURL})**\n${r.Text.split(" - ")[1] || ""}`
              )
              .join("\n\n")
          )
          .setFooter({
            text: `Page ${page + 1}/${pages} of DuckDuckGo Results`,
            iconURL: message.author.displayAvatarURL(),
          })
          .setColor(0x5865f2);
      };

      const getRow = (page) => {
        return new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("prev")
            .setLabel("◀")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === 0),
          new ButtonBuilder()
            .setCustomId("next")
            .setLabel("▶")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(page === pages - 1)
        );
      };

      const msg = await message.reply({
        embeds: [getEmbed(currentPage)],
        components: [getRow(currentPage)],
      });

      const collector = msg.createMessageComponentCollector({
        time: 300000,
      });

      collector.on("collect", async (i) => {
        if (i.user.id !== message.author.id) {
          await i.reply({
            content: "Only the command user can navigate pages",
            ephemeral: true,
          });
          return;
        }

        currentPage =
          i.customId === "prev"
            ? Math.max(0, currentPage - 1)
            : Math.min(pages - 1, currentPage + 1);

        await i.update({
          embeds: [getEmbed(currentPage)],
          components: [getRow(currentPage)],
        });
      });

      collector.on("end", () => {
        if (!msg.editable) return;

        const disabledRow = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId("prev")
            .setLabel("◀")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true),
          new ButtonBuilder()
            .setCustomId("next")
            .setLabel("▶")
            .setStyle(ButtonStyle.Primary)
            .setDisabled(true)
        );

        msg.edit({ components: [disabledRow] }).catch(() => null);
      });
    } catch (error) {
      console.error("Search error:", error);
      await message.reply("An error occurred while searching");
    }
  },
};
