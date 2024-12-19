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
    ),

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

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId("prev")
          .setLabel("◀")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(true),
        new ButtonBuilder()
          .setCustomId("next")
          .setLabel("▶")
          .setStyle(ButtonStyle.Primary)
          .setDisabled(pages <= 1)
      );

      const message = await interaction.editReply({
        embeds: [getEmbed(currentPage)],
        components: [row],
      });

      const collector = message.createMessageComponentCollector({
        time: 300000,
      });

      collector.on("collect", async (i) => {
        if (i.user.id !== interaction.user.id) {
          return i.reply({
            content: "Only the command user can navigate pages",
            ephemeral: true,
          });
        }

        if (i.customId === "prev" && currentPage > 0) {
          currentPage--;
        } else if (i.customId === "next" && currentPage < pages - 1) {
          currentPage++;
        }

        row.components[0].setDisabled(currentPage === 0);
        row.components[1].setDisabled(currentPage === pages - 1);

        await i.update({
          embeds: [getEmbed(currentPage)],
          components: [row],
        });
      });

      collector.on("end", () => {
        row.components.forEach((button) => button.setDisabled(true));
        message.edit({ components: [row] });
      });
    } catch (error) {
      console.error(error);
      await interaction.editReply("An error occurred while searching");
    }
  },
};
