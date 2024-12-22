import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

const calculate = (expression) => {
  const sanitized = expression.replace(/[^-()\d/*+.]/g, "");
  if (!sanitized) throw new Error("Invalid expression");

  const result = Function(`"use strict"; return (${sanitized})`)();
  if (!isFinite(result)) throw new Error("Result is not a finite number");

  return result;
};

export default {
  data: new SlashCommandBuilder()
    .setName("calculate")
    .setDescription("Calculates a mathematical expression")
    .addStringOption((option) =>
      option
        .setName("expression")
        .setDescription("The expression to calculate (e.g. 2 + 2)")
        .setRequired(true)
        .setMinLength(1)
    )
    .setIntegrationTypes([0, 1])
    .setContexts([0, 1, 2]),

  async execute(interaction) {
    const expression = interaction.options.getString("expression");

    try {
      const result = calculate(expression);
      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .addFields(
          { name: "Expression", value: `\`${expression}\``, inline: true },
          { name: "Result", value: `\`${result}\``, inline: true }
        );

      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(`Failed to calculate: ${error.message}`);

      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },

  async prefixExecute(message, args) {
    if (!args.length) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription("Please provide an expression to calculate");
      return message.reply({ embeds: [embed] });
    }

    const expression = args.join(" ");

    try {
      const result = calculate(expression);
      const embed = new EmbedBuilder()
        .setColor(0x57f287)
        .addFields(
          { name: "Expression", value: `\`${expression}\``, inline: true },
          { name: "Result", value: `\`${result}\``, inline: true }
        );

      await message.reply({ embeds: [embed] });
    } catch (error) {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setDescription(`Failed to calculate: ${error.message}`);

      await message.reply({ embeds: [embed] });
    }
  },
};
