import {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";
import getLocalCommands from "../../utils/getLocalCommands.js";

export default {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("Shows all available commands")
    .setIntegrationTypes([0, 1])
    .setContexts([0, 1, 2]),

  async execute(interaction) {
    await interaction.deferReply();
    const commands = await getLocalCommands();

    const categories = {
      info: commands.filter(
        (cmd) => cmd.data.name.startsWith("info") || cmd.category === "info"
      ),
      mod: commands.filter(
        (cmd) => cmd.data.name.startsWith("mod") || cmd.category === "mod"
      ),
      utility: commands.filter(
        (cmd) =>
          cmd.data.name.startsWith("utility") || cmd.category === "utility"
      ),
      misc: commands.filter(
        (cmd) =>
          !cmd.data.name.match(/^(info|mod|utility)/) &&
          cmd.category !== "info" &&
          cmd.category !== "mod" &&
          cmd.category !== "utility"
      ),
    };

    const pages = Object.entries(categories)
      .filter(([cmds]) => cmds.length > 0)
      .map(([category, cmds], index, array) => {
        const description = cmds
          .map((cmd) => `**/${cmd.data.name}**\n${cmd.data.description}`)
          .join("\n\n");
        return new EmbedBuilder()
          .setTitle(
            `${category.charAt(0).toUpperCase() + category.slice(1)} Commands`
          )
          .setDescription(description || "No commands in this category")
          .setColor(0x5865f2)
          .setFooter({
            text: `Page ${index + 1}/${array.length}`,
            iconURL: interaction.user.displayAvatarURL(),
          });
      });

    if (pages.length === 0) {
      return await interaction.editReply("No commands available.");
    }

    let currentPage = 0;

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
          .setDisabled(page === pages.length - 1)
      );
    };

    const message = await interaction.editReply({
      embeds: [pages[currentPage]],
      components: pages.length > 1 ? [getRow(currentPage)] : [],
      fetchReply: true,
    });

    if (pages.length <= 1) return;

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
          : Math.min(pages.length - 1, currentPage + 1);

      await interaction.editReply({
        embeds: [pages[currentPage]],
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
  },

  async prefixExecute(message) {
    const commands = await getLocalCommands();

    const categories = {
      info: commands.filter(
        (cmd) => cmd.data.name.startsWith("info") || cmd.category === "info"
      ),
      mod: commands.filter(
        (cmd) => cmd.data.name.startsWith("mod") || cmd.category === "mod"
      ),
      utility: commands.filter(
        (cmd) =>
          cmd.data.name.startsWith("utility") || cmd.category === "utility"
      ),
      misc: commands.filter(
        (cmd) =>
          !cmd.data.name.match(/^(info|mod|utility)/) &&
          cmd.category !== "info" &&
          cmd.category !== "mod" &&
          cmd.category !== "utility"
      ),
    };

    const pages = Object.entries(categories)
      .filter(([cmds]) => cmds.length > 0)
      .map(([category, cmds], index, array) => {
        const description = cmds
          .map((cmd) => `**%${cmd.data.name}**\n${cmd.data.description}`)
          .join("\n\n");
        return new EmbedBuilder()
          .setTitle(
            `${category.charAt(0).toUpperCase() + category.slice(1)} Commands`
          )
          .setDescription(description || "No commands in this category")
          .setColor(0x5865f2)
          .setFooter({
            text: `Page ${index + 1}/${array.length}`,
            iconURL: message.author.displayAvatarURL(),
          });
      });

    if (pages.length === 0) {
      return await message.reply("No commands available.");
    }

    let currentPage = 0;

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
          .setDisabled(page === pages.length - 1)
      );
    };

    const response = await message.reply({
      embeds: [pages[currentPage]],
      components: pages.length > 1 ? [getRow(currentPage)] : [],
      fetchReply: true,
    });

    if (pages.length <= 1) return;

    const collector = response.createMessageComponentCollector({
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
          : Math.min(pages.length - 1, currentPage + 1);

      await response.edit({
        embeds: [pages[currentPage]],
        components: [getRow(currentPage)],
      });

      await i.deferUpdate().catch(() => null);
    });

    collector.on("end", () => {
      if (!response.editable) return;

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

      response.edit({ components: [disabledRow] }).catch(() => null);
    });
  },
};
