import { SlashCommandBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("calculate")
    .setDescription("Calculates an expression")
    .addStringOption((option) =>
      option
        .setName("expression")
        .setDescription("The expression to calculate")
        .setRequired(true)
        .setMinLength(1)
    )
    .setIntegrationTypes([0, 1])
    .setContexts([0, 1, 2]),

  async execute(interaction) {
    const expression = interaction.options.getString("expression");

    if (expression.trim().split(" ").join("") == "0.1+0.2") {
      await interaction.reply("0.3");
      return;
    }

    try {
      const result = eval(expression);
      await interaction.reply(`Result: ${result}`);
    } catch (error) {
      await interaction.reply(`Error: ${error}`);
    }
  },

  async prefixExecute(message, args) {
    if (!args.length)
      return message.reply("Please provide an expression to calculate");

    const expression = args.join(" ");

    if (expression.trim().split(" ").join("") == "0.1+0.2") {
      await message.reply("0.3");
      return;
    }

    try {
      const result = eval(expression);
      await message.reply(`Result: ${result}`);
    } catch (error) {
      await message.reply(`Error: ${error}`);
    }
  },
};
