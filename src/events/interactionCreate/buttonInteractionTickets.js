import { ChannelType, EmbedBuilder, PermissionsBitField } from "discord.js";
import { getGuildTicket } from "../../schemas/guild.js";

export default async (client, interaction) => {
  if (!interaction.isButton()) return;

  try {
    switch (interaction.customId) {
      // new ticket
      case "new ticket":
        let category = await getGuildTicket(
          interaction.guild.id,
          interaction.channel.id
        );
        category = category["category"];

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
                  style: 2,
                  customId: "close ticket",
                  emoji: "🔒",
                },
                {
                  type: 2,
                  label: "Delete",
                  style: 4,
                  customId: "delete ticket",
                  emoji: "🗑️",
                }
              ],
            },
          ],
        });

        await interaction.reply({
          content: "Ticket created",
          ephemeral: true,
        });
        break;

      case "close ticket":
        await interaction.channel.permissionOverwrites.edit(
          interaction.channel.name.split("-")[1],
          { ViewChannel: false }
        );

        await interaction.reply({
          content: "Ticket closed",
          ephemeral: false,
        });
        break;

      case "delete ticket":
        if (
          !interaction.member.permissions.has([
            PermissionsBitField.Flags.ManageChannels,
          ])
        ) {
          return await interaction.reply({
            content: "You don't have permission to use this command",
            ephemeral: true,
          });
        }
        await interaction.channel.delete();
        break;
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
