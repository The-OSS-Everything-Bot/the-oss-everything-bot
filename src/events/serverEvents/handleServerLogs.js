import { EmbedBuilder, AuditLogEvent } from "discord.js";
import { getGuildSettings } from "../../utils/dbManager.js";

export default async (client, guild, eventType, data = {}) => {
  try {
    const settings = await getGuildSettings(guild.id);
    if (!settings?.log_channel_id) return;

    let logsChannel;
    try {
      logsChannel = await client.channels.fetch(settings.log_channel_id);
    } catch (err) {
      console.error("[Error] Failed to fetch logs channel:", err);
      return;
    }

    if (!logsChannel) return;

    const embed = new EmbedBuilder()
      .setTimestamp()
      .setFooter({ text: `ID: ${data.target?.id || "Unknown"}` });

    switch (eventType) {
      case AuditLogEvent.MemberUpdate:
        embed
          .setTitle("Member Updated")
          .setColor(0x3498db)
          .addFields(
            { name: "Member", value: `<@${data.target.id}>`, inline: true },
            {
              name: "Updated by",
              value: `<@${data.executor.id}>`,
              inline: true,
            }
          );

        if (data.changes?.length) {
          embed.addFields({ name: "Changes", value: data.changes.join("\n") });
        }

        if (data.reason) {
          embed.addFields({ name: "Reason", value: data.reason, inline: true });
        }
        break;

      case AuditLogEvent.ChannelCreate:
        embed
          .setTitle("Channel Created")
          .setColor(0x57f287)
          .addFields(
            { name: "Channel", value: `${data.target}`, inline: true },
            { name: "Created by", value: `${data.executor}`, inline: true },
            { name: "Type", value: `${data.target.type}`, inline: true }
          );
        break;

      case AuditLogEvent.ChannelDelete:
        embed
          .setTitle("Channel Deleted")
          .setColor(0xed4245)
          .addFields(
            { name: "Channel", value: data.changes[0].old, inline: true },
            { name: "Deleted by", value: `${data.executor}`, inline: true }
          );
        break;

      case AuditLogEvent.RoleCreate:
        embed
          .setTitle("Role Created")
          .setColor(0x57f287)
          .addFields(
            { name: "Role", value: `${data.target}`, inline: true },
            { name: "Created by", value: `${data.executor}`, inline: true }
          );
        break;

      case AuditLogEvent.RoleDelete:
        embed
          .setTitle("Role Deleted")
          .setColor(0xed4245)
          .addFields(
            { name: "Role", value: data.changes[0].old, inline: true },
            { name: "Deleted by", value: `${data.executor}`, inline: true }
          );
        break;

      case AuditLogEvent.MemberKick:
        embed
          .setTitle("Member Kicked")
          .setColor(0xed4245)
          .addFields(
            { name: "Member", value: `${data.target}`, inline: true },
            { name: "Kicked by", value: `${data.executor}`, inline: true },
            {
              name: "Reason",
              value: data.reason || "No reason provided",
              inline: true,
            }
          );
        break;

      case AuditLogEvent.MemberBanAdd:
        embed
          .setTitle("Member Banned")
          .setColor(0xed4245)
          .addFields(
            { name: "Member", value: `${data.target}`, inline: true },
            { name: "Banned by", value: `${data.executor}`, inline: true },
            {
              name: "Reason",
              value: data.reason || "No reason provided",
              inline: true,
            }
          );
        break;

      case AuditLogEvent.MemberBanRemove:
        embed
          .setTitle("Member Unbanned")
          .setColor(0x57f287)
          .addFields(
            { name: "Member", value: `${data.target}`, inline: true },
            { name: "Unbanned by", value: `${data.executor}`, inline: true }
          );
        break;

      case AuditLogEvent.MessageDelete:
        embed
          .setTitle("Message Deleted")
          .setColor(0xed4245)
          .addFields(
            { name: "Author", value: `<@${data.target.id}>`, inline: true },
            {
              name: "Deleted by",
              value: `<@${data.executor.id}>`,
              inline: true,
            },
            {
              name: "Channel",
              value: `<#${data.changes[0].channel.id}>`,
              inline: true,
            },
            { name: "Content", value: data.changes[0].content },
            { name: "Attachments", value: data.changes[0].attachments }
          );
        break;

      case AuditLogEvent.MessageBulkDelete:
        embed
          .setTitle("Messages Bulk Deleted")
          .setColor(0xed4245)
          .addFields(
            {
              name: "Channel",
              value: `<#${data.changes[0].channel.id}>`,
              inline: true,
            },
            {
              name: "Deleted by",
              value: `<@${data.executor.id}>`,
              inline: true,
            },
            {
              name: "Count",
              value: `${data.changes[0].count} messages`,
              inline: true,
            }
          );

        const messageList = data.changes[0].messages
          .map(
            (m) =>
              `${m.author}: ${m.content} ${m.attachments !== "None" ? `[${m.attachments}]` : ""}`
          )
          .join("\n")
          .slice(0, 1024);

        embed.addFields({
          name: "Messages",
          value:
            messageList.length === 1024 ? `${messageList}...` : messageList,
        });
        break;

      case AuditLogEvent.ChannelUpdate:
        embed
          .setTitle("Channel Updated")
          .setColor(0x3498db)
          .addFields(
            { name: "Channel", value: `<#${data.target.id}>`, inline: true },
            {
              name: "Updated by",
              value: `<@${data.executor.id}>`,
              inline: true,
            }
          );

        if (data.changes?.length) {
          embed.addFields({ name: "Changes", value: data.changes.join("\n") });
        }
        break;

      case AuditLogEvent.RoleUpdate:
        embed
          .setTitle("Role Updated")
          .setColor(0x3498db)
          .addFields(
            { name: "Role", value: `<@&${data.target.id}>`, inline: true },
            {
              name: "Updated by",
              value: `<@${data.executor.id}>`,
              inline: true,
            }
          );

        if (data.changes?.length) {
          embed.addFields({ name: "Changes", value: data.changes.join("\n") });
        }

        if (data.reason) {
          embed.addFields({ name: "Reason", value: data.reason, inline: true });
        }
        break;

      case AuditLogEvent.MemberTimeout:
        embed
          .setTitle("Member Timed Out")
          .setColor(0xed4245)
          .addFields(
            { name: "Member", value: `<@${data.target.id}>`, inline: true },
            { name: "Moderator", value: `<@${data.executor.id}>`, inline: true }
          );

        if (data.changes?.length) {
          embed.addFields({ name: "Duration", value: data.changes.join("\n") });
        }

        if (data.reason) {
          embed.addFields({ name: "Reason", value: data.reason, inline: true });
        }
        break;

      case "COMMAND_NUKE":
        embed
          .setTitle("Channel Nuked")
          .setColor(0xed4245)
          .addFields(
            { name: "Channel", value: `<#${data.target.id}>`, inline: true },
            {
              name: "Moderator",
              value: `<@${data.executor.id}>`,
              inline: true,
            },
            {
              name: "Messages Deleted",
              value: `${data.count || "Unknown"}`,
              inline: true,
            }
          );

        if (data.reason) {
          embed.addFields({ name: "Reason", value: data.reason, inline: true });
        }
        break;

      case "COMMAND_TIMEOUT":
        embed
          .setTitle(
            data.type === "untimeout"
              ? "Member Timeout Removed"
              : "Member Timed Out"
          )
          .setColor(data.type === "untimeout" ? 0x57f287 : 0xed4245)
          .addFields(
            { name: "Member", value: `<@${data.target.id}>`, inline: true },
            { name: "Moderator", value: `<@${data.executor.id}>`, inline: true }
          );

        if (data.type !== "untimeout") {
          embed.addFields({
            name: "Duration",
            value: data.duration,
            inline: true,
          });
        }

        if (data.reason) {
          embed.addFields({ name: "Reason", value: data.reason, inline: true });
        }
        break;

      case "COMMAND_UNTIMEOUT":
        embed
          .setTitle("Member Timeout Removed")
          .setColor(0x57f287)
          .addFields(
            { name: "Member", value: `<@${data.target.id}>`, inline: true },
            { name: "Moderator", value: `<@${data.executor.id}>`, inline: true }
          );

        if (data.reason) {
          embed.addFields({ name: "Reason", value: data.reason, inline: true });
        }
        break;

      case "COMMAND_JAIL":
        embed
          .setTitle(
            data.type === "unjail" ? "Member Unjailed" : "Member Jailed"
          )
          .setColor(data.type === "unjail" ? 0x57f287 : 0xed4245)
          .addFields(
            { name: "Member", value: `<@${data.target.id}>`, inline: true },
            { name: "Moderator", value: `<@${data.executor.id}>`, inline: true }
          );

        if (data.duration && data.type !== "unjail") {
          embed.addFields({
            name: "Duration",
            value: data.duration,
            inline: true,
          });
        }

        if (data.reason) {
          embed.addFields({ name: "Reason", value: data.reason, inline: true });
        }
        break;

      case "COMMAND_CLEARINFRACTIONS":
        embed
          .setTitle("Infractions Cleared")
          .setColor(0x57f287)
          .addFields(
            { name: "Target", value: `<@${data.target.id}>`, inline: true },
            { name: "Moderator", value: `<@${data.executor.id}>`, inline: true }
          );
        break;

      case "COMMAND_LOGS":
        embed
          .setTitle("Logs Checked")
          .setColor(0x3498db)
          .addFields(
            { name: "Target", value: `<@${data.target.id}>`, inline: true },
            {
              name: "Checked by",
              value: `<@${data.executor.id}>`,
              inline: true,
            }
          );
        break;

      case "COMMAND_WARN":
        embed
          .setTitle("Member Warned")
          .setColor(0xffd700)
          .addFields(
            { name: "Member", value: `<@${data.target.id}>`, inline: true },
            { name: "Moderator", value: `<@${data.executor.id}>`, inline: true }
          );

        if (data.reason) {
          embed.addFields({ name: "Reason", value: data.reason, inline: true });
        }
        break;
    }

    try {
      await logsChannel.send({ embeds: [embed] });
    } catch (err) {
      console.error("[Error] Failed to send log message:", err);
      return;
    }
  } catch (error) {
    console.error("[Error] Server logs failed:", error);
  }
};
