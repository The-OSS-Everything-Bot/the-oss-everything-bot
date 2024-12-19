import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { getUser } from "../../schemas/user.js";

export default {
  data: new SlashCommandBuilder()
    .setName("logs")
    .setDescription("Gets the moderation logs for a user")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to get logs for")
        .setRequired(true)
    )
    .setIntegrationTypes([0, 1])
    .setContexts([0, 1]),

  async execute(interaction) {
    const user = interaction.options.getUser("user");
    const guildId = interaction.guildId;
    const userData = await getUser(user.id, guildId);

    if (!userData) {
      return interaction.reply({
        content: "This user has no moderation logs",
        ephemeral: true,
      });
    }

    const hasLogs = Object.values(userData).some(
      (logs) => Array.isArray(logs) && logs.length > 0
    );

    if (!hasLogs) {
      return interaction.reply({
        content: "This user has no moderation logs",
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle(`Moderation Logs for ${user.tag}`)
      .setAuthor({
        name: `ID: ${user.id}`,
        iconURL: user.displayAvatarURL(),
      })
      .setFooter({
        text: interaction.user.tag,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setColor(0x00ff00);

    const addLogsToEmbed = (actionType, logs) => {
      if (!logs?.length) return;

      embed.addFields({
        name: actionType.charAt(0).toUpperCase() + actionType.slice(1),
        value: logs
          .map(
            ({ reason, by, createdAt }) =>
              `**By:** <@${by}>\n**Reason:** ${reason}\n**Date:** ${new Date(createdAt).toLocaleString()}`
          )
          .join("\n\n"),
      });
    };

    ["warns", "bans", "kicks", "timeouts", "jails"].forEach((actionType) => {
      addLogsToEmbed(actionType, userData[actionType]);
    });

    return interaction.reply({ embeds: [embed] });
  },
};
