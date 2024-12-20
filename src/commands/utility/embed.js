import { EmbedBuilder, SlashCommandBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("embed")
    .setDescription("Sends an embed")
    .addStringOption((option) =>
      option
        .setName("header")
        .setDescription("The header of the embed")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("The message to send")
        .setRequired(true)
        .setMinLength(1)
    )
    .setIntegrationTypes([0, 1])
    .setContexts([0, 1, 2]),

  async execute(interaction) {
    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle(interaction.options.getString("header"))
          .setDescription(interaction.options.getString("message"))
          .setAuthor({
            name: interaction.user.tag,
            iconURL: interaction.user.displayAvatarURL(),
          }),
      ],
    });
  },

  async prefixExecute(message, args) {
    if (args.length < 2)
      return message.reply("Please provide a header and message");

    const header = args[0];
    const content = args.slice(1).join(" ");

    await message.reply({
      embeds: [
        new EmbedBuilder().setTitle(header).setDescription(content).setAuthor({
          name: message.author.tag,
          iconURL: message.author.displayAvatarURL(),
        }),
      ],
    });
  },
};
