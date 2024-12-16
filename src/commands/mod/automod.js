import { SlashCommandBuilder } from "discord.js";

export default {
  data: new SlashCommandBuilder()
    .setName("automod")
    .setDescription("Automod commands")
    .addSubcommand((subcommand) =>
      subcommand.setName("filter").setDescription("Filter messages")
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("filter-word")
        .setDescription("Filter list of words.")
        .addStringOption((option) =>
          option
            .setName("words")
            .setDescription("ex: word1 word2 word3")
            .setRequired(true)
        )
    )
    .setIntegrationTypes([0])
    .setContexts([0, 1]),

  async execute(interaction) {
    await interaction.reply("Not implemented yet");
    const subcommand = interaction.options.getSubcommand();

    try {
      let rule;

      switch (subcommand) {
        case "filter":
          await interaction.editReply("loading rule...");

          rule = await interaction.guild.autoModerationRules.create({
            name: "Block bad words",
            creatorId: interaction.user.id,
            enabled: true,
            eventType: 1,
            triggerType: 4,
            triggerMetadata: {
              presets: [1, 2, 3],
            },
            actions: [
              {
                type: 1,
                metadata: {
                  warningMessage: "Bad word detected",
                },
              },

              {
                type: 2,
                metadata: {
                  channel: interaction.channel.id,
                  durationSeconds: 60,
                  customMessage: "Bad word detected",
                },
              },
            ],
          });

        case "filter-word":
          await interaction.editReply("loading...");

          const words = interaction.options.getString("words").split(" ");

          rule = await interaction.guild.autoModerationRules.create({
            name: "Block bad words",
            creatorId: interaction.user.id,
            enabled: true,
            eventType: 1,
            triggerType: 1,
            triggerMetadata: {
              keywordFilter: words,
            },
            actions: [
              {
                type: 1,
                metadata: {
                  warningMessage: "Bad word detected",
                },
              },

              {
                type: 2,
                metadata: {
                  channel: interaction.channel.id,
                  durationSeconds: 60,
                  customMessage: "Bad word detected",
                },
              },
            ],
          });
      }
      await interaction.editReply({
        content: `Rule created: ${rule.id}`,
      });
    } catch (err) {
      await interaction.editReply({
        content: `Error occured`,
      });
      console.log(err);
    }
  },
};
