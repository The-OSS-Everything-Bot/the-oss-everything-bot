import { SlashCommandBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with Pong!")
    .setIntegrationTypes([0, 1])
    .setContexts([0, 1, 2]),

  async execute(interaction) {
    const start = Date.now();

    if (interaction.isChatInputCommand?.()) {
      await interaction.deferReply();
      const ping = Date.now() - start;
      await interaction.editReply(`Pong! \`${ping}ms\``);
    } else {
      const msg = await interaction.reply("Pinging...");
      const ping = Date.now() - start;
      await msg.edit(`Pong! \`${ping}ms\``);
    }
  },
};
