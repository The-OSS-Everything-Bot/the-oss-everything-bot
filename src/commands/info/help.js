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
    .addStringOption((option) =>
      option
        .setName("command")
        .setDescription("Get detailed help for a specific command")
        .setRequired(false)
    )
    .setIntegrationTypes([0])
    .setContexts([0]),

  async execute(interaction) {
    await interaction.deferReply();
    const commands = await getLocalCommands();
    const specificCommand = interaction.options.getString("command");

    if (specificCommand) {
      const command = commands.find(
        (cmd) => cmd.data.name === specificCommand.toLowerCase()
      );
      if (!command) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setDescription(`Command \`${specificCommand}\` not found`);
        return interaction.editReply({ embeds: [embed] });
      }

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(`Command: ${command.data.name}`)
        .setDescription(command.data.description)
        .addFields({
          name: "Category",
          value: command.category || "Misc",
          inline: true,
        });

      if (command.data.options?.length) {
        const options = command.data.options
          .map(
            (opt) =>
              `\`${opt.name}\` - ${opt.description}${opt.required ? " (Required)" : ""}`
          )
          .join("\n");
        embed.addFields({ name: "Options", value: options });
      }

      return interaction.editReply({ embeds: [embed] });
    }

    const categories = {
      info: commands.filter(
        (cmd) =>
          cmd.category === "info" ||
          cmd.data.name.match(/^(info|serverinfo|help)/)
      ),
      mod: commands.filter(
        (cmd) =>
          cmd.category === "mod" ||
          cmd.data.name.match(
            /^(ban|kick|warn|timeout|jail|role|logs|clearinfractions|untimeout|unban)/
          )
      ),
      utility: commands.filter(
        (cmd) =>
          cmd.category === "utility" ||
          cmd.data.name.match(/^(ticket|search|status|setlogs)/)
      ),
      misc: commands.filter(
        (cmd) =>
          !cmd.category &&
          !cmd.data.name.match(
            /^(info|serverinfo|help|ban|kick|warn|timeout|jail|role|logs|clearinfractions|untimeout|unban|ticket|search|status|setlogs|commit)/
          )
      ),
    };

    const pages = Object.entries(categories)
      .filter(([, cmds]) => cmds.length > 0)
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
            text: `Page ${index + 1}/${array.length} • Use /help <command> for information`,
            iconURL: interaction.user.displayAvatarURL(),
          });
      });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("help_prev")
        .setLabel("Previous")
        .setStyle(ButtonStyle.Secondary),
      new ButtonBuilder()
        .setCustomId("help_next")
        .setLabel("Next")
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.editReply({
      embeds: [pages[0]],
      components: pages.length > 1 ? [row] : [],
    });
  },

  async prefixExecute(message, args) {
    const commands = await getLocalCommands();
    const specificCommand = args[0]?.toLowerCase();

    if (specificCommand) {
      const command = commands.find((cmd) => cmd.data.name === specificCommand);
      if (!command) {
        const embed = new EmbedBuilder()
          .setColor(0xff0000)
          .setDescription(`Command \`${specificCommand}\` not found`);
        return message.reply({ embeds: [embed] });
      }

      const embed = new EmbedBuilder()
        .setColor(0x5865f2)
        .setTitle(`Command: ${command.data.name}`)
        .setDescription(command.data.description)
        .addFields({
          name: "Category",
          value: command.category || "Misc",
          inline: true,
        });

      if (command.data.options?.length) {
        const options = command.data.options
          .map(
            (opt) =>
              `\`${opt.name}\` - ${opt.description}${opt.required ? " (Required)" : ""}`
          )
          .join("\n");
        embed.addFields({ name: "Options", value: options });
      }

      return message.reply({ embeds: [embed] });
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("Command Categories")
      .setDescription("Use `%help <command>` for information about a command")
      .addFields(
        { name: "📝 Info", value: "`help`, `serverinfo`", inline: true },
        {
          name: "🛡️ Moderation",
          value:
            "`antiraid`, `ban`, `clearinfractions`, `jail`, `kick`, `logs`, `nuke`, `role`, `setlogs`, `timeout`, `unban`, `unjail`, `untimeout`, `warn`",
          inline: true,
        },
        {
          name: "🔧 Utility",
          value: "`alias`, `calculate`, `embed`, `prefix`, `search`, `ticket`",
          inline: true,
        },
        {
          name: "🎮 Misc",
          value: "`ping`, `status`, `commit`",
          inline: true,
        }
      )
      .setFooter({
        text: message.author.tag,
        iconURL: message.author.displayAvatarURL(),
      });

    return message.reply({ embeds: [embed] });
  },
};
