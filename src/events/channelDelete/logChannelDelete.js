import { AuditLogEvent } from "discord.js";
import handleServerLogs from "../serverEvents/handleServerLogs.js";

export default async (client, channel) => {
  if (!channel.guild) return;

  const auditLogs = await channel.guild.fetchAuditLogs({
    limit: 1,
    type: AuditLogEvent.ChannelDelete,
  });
  const log = auditLogs.entries.first();

  await handleServerLogs(client, channel.guild, AuditLogEvent.ChannelDelete, {
    target: channel,
    executor: log?.executor || client.user,
    changes: [
      {
        old: channel.name,
        type: channel.type,
        category: channel.parent?.name || "None",
      },
    ],
  });
};
