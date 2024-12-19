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
    const userData = await getUser(user.id);

    if (!userData?.warns?.length) {
      return interaction.reply({
        content: "This user has no moderation logs",
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setTitle(`Moderation Logs for ${user.tag}`)
      .setDescription(
        userData.warns
          .map(
            ({ reason, by, createdAt }) =>
              `**Warn:** ${reason}\n**By:** <@${by}>\n**Date:** ${new Date(createdAt).toLocaleString()}\n`
          )
          .join("\n")
      )
      .setAuthor({
        name: `ID: ${user.id}`,
        iconURL: user.displayAvatarURL(),
      })
      .setFooter({
        text: interaction.user.tag,
        iconURL: interaction.user.displayAvatarURL(),
      })
      .setColor(0x00ff00);

    return interaction.reply({ embeds: [embed] });
  },
};
