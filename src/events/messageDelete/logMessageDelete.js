import { AuditLogEvent } from "discord.js";
import handleServerLogs from "../serverEvents/handleServerLogs.js";

export default async (client, message) => {
  if (!message.guild || message.author?.bot) return;

  const auditLogs = await message.guild.fetchAuditLogs({
    limit: 1,
    type: AuditLogEvent.MessageDelete,
  });
  const log = auditLogs.entries.first();

  if (
    log &&
    log.target.id === message.author.id &&
    log.createdTimestamp > Date.now() - 5000
  ) {
    await handleServerLogs(client, message.guild, AuditLogEvent.MessageDelete, {
      target: message.author,
      executor: log?.executor || client.user,
      changes: [
        {
          channel: message.channel,
          content:
            message.content || "No content (possibly embed or attachment)",
          attachments: message.attachments.size
            ? `${message.attachments.size} attachments`
            : "None",
        },
      ],
    });
  }
};
