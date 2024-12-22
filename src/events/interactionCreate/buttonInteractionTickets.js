import { ChannelType, EmbedBuilder, PermissionsBitField } from "discord.js";
import { getGuildTickets, getGuildSettings } from "../../utils/dbManager.js";

export default async (client, interaction) => {
  if (!interaction.isButton()) return;

  try {
    switch (interaction.customId) {
      case "new ticket": {
        await interaction.deferReply({ ephemeral: true });
        const settings = await getGuildTickets(interaction.guildId);
        if (!settings?.category_id) {
          const embed = new EmbedBuilder()
            .setColor(0xff0000)
            .setDescription("Ticket system not configured");
          return await interaction.editReply({
            embeds: [embed],
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

        const guildSettings = await getGuildSettings(interaction.guildId);
        if (guildSettings?.log_channel_id) {
          const logChannel = await interaction.client.channels.fetch(
            guildSettings.log_channel_id
          );
          if (logChannel) {
            await logChannel.send({
              embeds: [
                new EmbedBuilder()
                  .setTitle(`Ticket Created - ${channel.name}`)
                  .setDescription(`Created by ${interaction.user.tag}`)
                  .addFields(
                    {
                      name: "User ID",
                      value: interaction.user.id,
                      inline: true,
                    },
                    { name: "Channel", value: `<#${channel.id}>`, inline: true }
                  )
                  .setColor(0x57f287)
                  .setTimestamp(),
              ],
            });
          }
        }

        await channel
          .send({
            embeds: [
              new EmbedBuilder()
                .setTitle("Ticket ID: " + channel.id)
                .setDescription(
                  "Please describe the reasoning for opening this ticket.\n\nOur staff team will assist you as soon as possible. In the meantime, please provide as much detail as possible about your issue."
                )
                .setColor(0x5865f2)
                .setTimestamp(),
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
          })
          .then((msg) => msg.pin());

        const successEmbed = new EmbedBuilder()
          .setColor(0x57f287)
          .setDescription(`Ticket created in <#${channel.id}>`);

        await interaction.editReply({
          embeds: [successEmbed],
          ephemeral: true,
        });
        break;
      }

      case "close ticket": {
        const closeEmbed = new EmbedBuilder()
          .setColor(0xed4245)
          .setDescription("Ticket will be closed in 3 seconds...")
          .setTimestamp();

        await interaction.reply({ embeds: [closeEmbed], ephemeral: false });

        const messages = await interaction.channel.messages.fetch({
          limit: 100,
        });
        const logContent = messages
          .reverse()
          .map(
            (msg) =>
              `${msg.createdAt.toISOString()} | ${msg.author.tag} (${msg.author.id}): ${msg.content}`
          )
          .join("\n");

        const settings = await getGuildSettings(interaction.guildId);
        if (settings?.log_channel_id) {
          const logChannel = await interaction.client.channels.fetch(
            settings.log_channel_id
          );
          if (logChannel) {
            const buffer = Buffer.from(logContent, "utf-8");
            await logChannel.send({
              files: [
                {
                  attachment: buffer,
                  name: `ticket-${interaction.channel.name}-logs.txt`,
                },
              ],
              embeds: [
                new EmbedBuilder()
                  .setTitle(`Ticket Closed - ${interaction.channel.name}`)
                  .setDescription(`Closed by ${interaction.user.tag}`)
                  .addFields(
                    {
                      name: "User ID",
                      value: interaction.user.id,
                      inline: true,
                    },
                    {
                      name: "Channel",
                      value: `<#${interaction.channel.id}>`,
                      inline: true,
                    }
                  )
                  .setColor(0xed4245)
                  .setTimestamp(),
              ],
            });
          }
        }

        setTimeout(() => interaction.channel.delete(), 3000);
        break;
      }
    }
  } catch (error) {
    console.error(
      "\x1b[31m",
      `[Error] ${error} at buttonInteractionTickets.js`
    );
    const embed = new EmbedBuilder()
      .setColor(0xff0000)
      .setDescription(`Failed to process ticket action: ${error.message}`);
    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
