import { ChannelType, EmbedBuilder, PermissionsBitField } from "discord.js";
import { readFileSync } from "fs";

export default async (client, interaction) => {
  if (!interaction.isButton()) return;
  if (!interaction.customId.split(" ")[1] == "ticket") return;

  try {
    await interaction.deferReply({ ephemeral: true });
    switch (interaction.customId) {
      // new ticket
      case "new ticket":
        const category = JSON.parse(readFileSync("./settings.json"))["tickets"][
          interaction.guild.id
        ].category;

        console.log(category);

        const channel = await interaction.guild.channels.create({
          name: `ticket-${interaction.user.id}`,
          parent: category,
          permissionOverwrites: [
            {
              id: interaction.guild.roles.everyone.id,
              deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
              id: interaction.user.id,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ReadMessageHistory,
              ],
            },
            {
              id: client.user.id,
              allow: [
                PermissionsBitField.Flags.ViewChannel,
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.ReadMessageHistory,
              ],
            },
          ],
          type: ChannelType.GuildText,
        });

        await channel.send({
          embeds: [
            new EmbedBuilder()
              .setTitle("Ticket id: " + channel.id)
              .setDescription("Close ticket?"),
          ],
          components: [
            {
              type: 1,
              components: [
                {
                  type: 2,
                  label: "Close",
                  style: 4,
                  customId: "close",
                  emoji: "🔒",
                },
              ],
            },
          ],
        });

        await interaction.editReply({
          content: "Ticket created",
          ephemeral: true,
        });
        break;

      // close ticket
      case "close ticket":
        // remove read permission from all users
        await interaction.channel.permissionOverwrites.edit(
          interaction.channel.name.split("-")[1],
          { ViewChannel: false }
        );

        await interaction.editReply({
          content: "Ticket closed",
          ephemeral: false,
        });
    }
  } catch (error) {
    interaction.editReply("Something went wrong");
    console.log(`[error] ${error}`);
  }
};
