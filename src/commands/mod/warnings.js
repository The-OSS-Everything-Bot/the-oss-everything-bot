import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import userModel from "../../schemas/user.js";

export default {
  data: new SlashCommandBuilder()
    .setName("warnings")
    .setDescription("Gets the warns of a user")
    .addUserOption((option) =>
      option
        .setName("user")
        .setDescription("The user to get the warns of")
        .setRequired(true)
    )
    .setIntegrationTypes([0, 1])
    .setContexts([0, 1]),

  async execute(interaction) {
    const user = interaction.options.getUser("user");

    const userData = await userModel.findOne({ id: user.id }).exec();

    if (!userData) {
      return await interaction.reply({
        content: "This user has no warns",
        ephemeral: true,
      });
    } else {
      const { warns, id } = userData;
      return await interaction.reply({
        embeds: [
          new EmbedBuilder({
            title: `Warns of ${user.tag}`,
            description: warns
              .map(
                ({ reason, by, createdAt }) =>
                  `${reason} - ${new Date(
                    createdAt
                  ).toLocaleString()} - <@${by}>`
              )
              .join("\n"),
            author: {
              name: `Id: ${id}`,
              iconURL: user.displayAvatarURL(),
            },
            footer: {
              text: interaction.user.tag,
              iconURL: interaction.user.displayAvatarURL(),
            },
            color: 0x00ff00,
          }),
        ],
      });
    }
  },
};
