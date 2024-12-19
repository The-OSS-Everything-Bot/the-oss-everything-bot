import { SlashCommandBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!")
    .setIntegrationTypes([0, 1])
    .setContexts([0, 1, 2]),

  async execute(interaction) {
    const start = Date.now();
    await interaction.deferReply();
    const ping = Date.now() - start;
    await interaction.editReply(`Pong! \`${ping}ms\``);
  },
};
