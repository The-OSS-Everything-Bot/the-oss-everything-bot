import { EmbedBuilder } from "discord.js";
import { getUser } from "../../schemas/user.js";

export default async (client, interaction) => {
  if (!interaction.isButton()) return;

  const buttonId = interaction.customId;
  if (
    !buttonId.startsWith("take_action_") &&
    !buttonId.startsWith("user_info_") &&
    !buttonId.startsWith("ignore_")
  )
    return;

  const userId = buttonId.split("_")[2];

  try {
    if (buttonId.startsWith("ignore_")) {
      try {
        await interaction.message.edit({
          components: [],
          embeds: [
            EmbedBuilder.from(interaction.message.embeds[0])
              .setColor(0x2b2d31)
              .setTitle("Report Dismissed"),
          ],
        });
        await interaction.reply({
          content: "Report dismissed",
          ephemeral: true,
        });
      } catch (error) {
        if (error.code === 40060) {
          await interaction.followUp({
            content: "Report dismissed",
            ephemeral: true,
          });
        } else if (error.code !== 10008) {
          throw error;
        }
      }
      return;
    }

    if (buttonId.startsWith("take_action_")) {
      if (
        !interaction.member.permissions.has([
          PermissionFlagsBits.ModerateMembers,
        ])
      ) {
        return await interaction.reply({
          content: "You don't have permission to use this action",
          ephemeral: true,
        });
      }

      const row = new ActionRowBuilder().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`mod_action_${userId}`)
          .setPlaceholder("Select an action")
          .addOptions([
            { label: "Ban", value: "ban", description: "Ban the user" },
            { label: "Kick", value: "kick", description: "Kick the user" },
            {
              label: "Timeout",
              value: "timeout",
              description: "Timeout the user",
            },
            { label: "Warn", value: "warn", description: "Warn the user" },
            {
              label: "Delete Messages",
              value: "delete",
              description: "Delete user messages",
            },
            {
              label: "Accept Report",
              value: "accept",
              description: "Mark report as handled",
            },
          ])
      );

      try {
        await interaction.reply({
          content: "Select an action to take:",
          components: [row],
          ephemeral: true,
        });
      } catch (error) {
        if (error.code === 40060) {
          await interaction.followUp({
            content: "Select an action to take:",
            components: [row],
            ephemeral: true,
          });
        } else {
          throw error;
        }
      }
    } else if (buttonId.startsWith("user_info_")) {
      const user = await client.users.fetch(userId);
      const userData = await getUser(userId, interaction.guildId);
      const member = await interaction.guild.members.fetch(userId);

      const embed = new EmbedBuilder()
        .setTitle(`User Information - ${user.tag}`)
        .setThumbnail(user.displayAvatarURL({ dynamic: true }))
        .setColor(0x2b2d31)
        .addFields(
          { name: "ID", value: user.id, inline: true },
          {
            name: "Created",
            value: `<t:${Math.floor(user.createdTimestamp / 1000)}:R>`,
            inline: true,
          },
          {
            name: "Joined",
            value: `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`,
            inline: true,
          },
          {
            name: "Roles",
            value:
              member.roles.cache.map((r) => r.toString()).join(" ") || "None",
          }
        );

      if (userData) {
        const addInfractionField = (type, data) => {
          if (data?.length) {
            embed.addFields({
              name: `${type} (${data.length})`,
              value:
                data
                  .slice(-3)
                  .map(
                    (i) =>
                      `• ${i.reason} by <@${i.by}> (<t:${Math.floor(i.createdAt / 1000)}:R>)`
                  )
                  .join("\n") + (data.length > 3 ? "\n*(showing last 3)*" : ""),
            });
          }
        };

        ["warns", "bans", "kicks", "timeouts", "jails"].forEach((type) => {
          addInfractionField(
            type.charAt(0).toUpperCase() + type.slice(1),
            userData[type]
          );
        });
      }

      try {
        await interaction.reply({ embeds: [embed], ephemeral: true });
      } catch (error) {
        if (error.code === 40060) {
          await interaction.followUp({ embeds: [embed], ephemeral: true });
        } else {
          throw error;
        }
      }
    }
  } catch (error) {
    console.error(error);
    try {
      await interaction.reply({
        content: "An error occurred while processing the button",
        ephemeral: true,
      });
    } catch (e) {
      if (e.code === 40060) {
        await interaction.followUp({
          content: "An error occurred while processing the button",
          ephemeral: true,
        });
      }
    }
  }
};
