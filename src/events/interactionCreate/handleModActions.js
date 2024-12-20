import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { getUser, createUser, updateUserLogs } from "../../schemas/user.js";

export default async (client, interaction) => {
  if (!interaction.isStringSelectMenu() && !interaction.isButton()) return;
  if (
    !interaction.customId.startsWith("mod_action_") &&
    !interaction.customId.startsWith("take_action_")
  )
    return;

  if (
    !interaction.member.permissions.has([PermissionFlagsBits.ModerateMembers])
  )
    return await interaction.reply({
      content: "You don't have permission to use this command",
      ephemeral: true,
    });

  const userId = interaction.customId.split("_")[2];
  const action = interaction.isStringSelectMenu()
    ? interaction.values[0]
    : null;

  if (!action) return;

  try {
    const user = await client.users.fetch(userId);
    const member = await interaction.guild.members.fetch(userId);
    const reason = "Automated action from report";

    switch (action) {
      case "delete":
        try {
          const reportMessage = await interaction.channel.messages.fetch(
            interaction.message.reference?.messageId || interaction.message.id
          );
          const channelId = reportMessage.embeds[0].fields
            .find((f) => f.name === "Channel")
            ?.value.match(/\d+/)[0];

          if (channelId) {
            const channel = await client.channels.fetch(channelId);
            const messageContent = reportMessage.embeds[0].fields.find(
              (f) => f.name === "Message"
            )?.value;

            const messages = await channel.messages.fetch({ limit: 100 });
            const targetMessage = messages.find(
              (m) => m.content === messageContent
            );

            if (targetMessage) {
              await targetMessage.delete();
              await reportMessage.edit({
                components: [],
                embeds: [
                  EmbedBuilder.from(reportMessage.embeds[0])
                    .setColor(0x57f287)
                    .setTitle("Message Deleted"),
                ],
              });
              await interaction.reply({
                content: "Message deleted successfully",
                ephemeral: true,
              });
            }
          }
        } catch (error) {
          console.error("[Error] Failed to delete message:", error);
          await interaction.reply({
            content: "Failed to delete message",
            ephemeral: true,
          });
        }
        break;

      case "ban":
        await member.ban({ reason });
        await logAction(interaction, user, "bans", reason);
        break;

      case "kick":
        await member.kick(reason);
        await logAction(interaction, user, "kicks", reason);
        break;

      case "timeout":
        await member.timeout(3600000, reason);
        await logAction(interaction, user, "timeouts", reason);
        break;

      case "warn":
        await logAction(interaction, user, "warns", reason);
        break;

      case "accept":
        try {
          const message = await interaction.channel.messages.fetch(
            interaction.message.reference?.messageId || interaction.message.id
          );
          await message.edit({
            components: [],
            embeds: [
              EmbedBuilder.from(message.embeds[0])
                .setColor(0x57f287)
                .setTitle("Report Accepted"),
            ],
          });
        } catch (error) {
          if (error.code !== 10008) throw error;
        }
        break;
    }

    try {
      await interaction.reply({
        content: `Action "${action}" executed successfully`,
        ephemeral: true,
      });
    } catch (error) {
      if (error.code === 40060) {
        await interaction.followUp({
          content: `Action "${action}" executed successfully`,
          ephemeral: true,
        });
      }
    }
  } catch (error) {
    console.error(error);
    try {
      await interaction.reply({
        content: "An error occurred while executing the action",
        ephemeral: true,
      });
    } catch (e) {
      if (e.code === 40060) {
        await interaction.followUp({
          content: "An error occurred while executing the action",
          ephemeral: true,
        });
      }
    }
  }
};

async function logAction(interaction, user, actionType, reason) {
  let userData = await getUser(user.id, interaction.guildId);
  let actions = userData?.[actionType] || [];

  actions.push({
    reason,
    by: interaction.user.id,
    createdAt: Date.now(),
  });

  if (!userData) {
    await createUser(user.id, interaction.guildId, { [actionType]: actions });
  } else {
    await updateUserLogs(user.id, interaction.guildId, actionType, actions);
  }

  try {
    await interaction.message.edit({
      components: [],
      embeds: [
        EmbedBuilder.from(interaction.message.embeds[0])
          .setColor(0x57f287)
          .setTitle(
            `Report Handled - ${actionType.slice(0, -1).toUpperCase()}`
          ),
      ],
    });
  } catch (error) {
    if (error.code !== 10008) throw error;
  }
}
