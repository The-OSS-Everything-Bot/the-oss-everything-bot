import { ChannelType, EmbedBuilder, PermissionsBitField } from "discord.js";
import { getGuildTickets } from "../../utils/dbManager.js";

export default async (client, interaction) => {
  if (!interaction.isButton()) return;

  try {
    switch (interaction.customId) {
      case "new ticket": {
        await interaction.deferReply({ ephemeral: true });
        const settings = await getGuildTickets(interaction.guildId);
        if (!settings?.category_id) {
          return await interaction.editReply({
            content: "Ticket system not configured",
            ephemeral: true,
          });
        }

        const channel = await interaction.guild.channels.create({
          name: `ticket-${interaction.user.id}`,
          parent: settings.category_id,
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
                  customId: "close ticket",
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
      }

      case "close ticket": {
        await interaction.channel.permissionOverwrites.edit(
          interaction.channel.name.split("-")[1],
          { ViewChannel: false }
        );

        await interaction.reply({
          content: "Ticket closed",
          ephemeral: false,
        });
        break;
      }
    }
  } catch (error) {
    console.error(`[Error] ${error}`);
    await interaction
      .reply({
        content: "Something went wrong",
        ephemeral: true,
      })
      .catch(() => {});
  }
};
