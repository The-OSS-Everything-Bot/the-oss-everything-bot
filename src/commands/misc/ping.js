import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Shows bot latency")
    .setIntegrationTypes([0, 1])
    .setContexts([0, 1, 2]),

  async execute(interaction) {
    await interaction.deferReply();

    const reply = await interaction.fetchReply();
    const ping = reply.createdTimestamp - interaction.createdTimestamp;

    const embed = new EmbedBuilder()
      .setColor(0x57f287)
      .setDescription(`Pong! \`${ping}ms\``);

    await interaction.editReply({ embeds: [embed] });
  },

  async prefixExecute(message) {
    const ping = Date.now() - message.createdTimestamp;

    const embed = new EmbedBuilder()
      .setColor(0x57f287)
      .setDescription(`Pong! \`${ping}ms\``);

    await message.reply({ embeds: [embed] });
  },
};
