import { EmbedBuilder, SlashCommandBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("embed")
    .setDescription("Creates a custom embed message")
    .addStringOption((option) =>
      option
        .setName("title")
        .setDescription("The title of the embed")
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(256)
    )
    .addStringOption((option) =>
      option
        .setName("content")
        .setDescription("The content of the embed")
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(4096)
    )
    .setIntegrationTypes([0, 1])
    .setContexts([0, 1, 2]),

  async execute(interaction) {
    try {
      const title = interaction.options.getString("title");
      const content = interaction.options.getString("content");

      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setTitle(title)
        .setDescription(content)
        .setAuthor({
          name: interaction.user.tag,
          iconURL: interaction.user.displayAvatarURL(),
        })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      const errorEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(`Failed to create embed: ${error.message}`);
      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  },

  async prefixExecute(message, args) {
    try {
      if (args.length < 2) {
        const errorEmbed = new EmbedBuilder()
          .setColor(0xff0000)
          .setDescription(
            "Please provide both a title and content for the embed"
          );
        return message.reply({ embeds: [errorEmbed] });
      }

      const title = args[0];
      const content = args.slice(1).join(" ");

      if (title.length > 256 || content.length > 4096) {
        const errorEmbed = new EmbedBuilder()
          .setColor(0xff0000)
          .setDescription("Title or content exceeds maximum length");
        return message.reply({ embeds: [errorEmbed] });
      }

      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .setTitle(title)
        .setDescription(content)
        .setAuthor({
          name: message.author.tag,
          iconURL: message.author.displayAvatarURL(),
        })
        .setTimestamp();

      await message.reply({ embeds: [embed] });
    } catch (error) {
      const errorEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(`Failed to create embed: ${error.message}`);
      await message.reply({ embeds: [errorEmbed] });
    }
  },
};
