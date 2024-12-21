import { AuditLogEvent } from "discord.js";
import handleServerLogs from "../serverEvents/handleServerLogs.js";

export default async (client, messages) => {
  if (!messages.first().guild) return;

  const auditLogs = await messages.first().guild.fetchAuditLogs({
    limit: 1,
    type: AuditLogEvent.MessageBulkDelete,
  });
  const log = auditLogs.entries.first();

  await handleServerLogs(
    client,
    messages.first().guild,
    AuditLogEvent.MessageBulkDelete,
    {
      target: messages.first().channel,
      executor: log?.executor || client.user,
      changes: [
        {
          count: messages.size,
          channel: messages.first().channel,
          messages: messages.map((m) => ({
            author: m.author?.tag || "Unknown",
            content: m.content || "No content (possibly embed or attachment)",
            attachments: m.attachments.size
              ? `${m.attachments.size} attachments`
              : "None",
          })),
        },
      ],
    }
  );
};
