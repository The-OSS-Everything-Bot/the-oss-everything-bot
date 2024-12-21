import { AuditLogEvent } from "discord.js";
import handleServerLogs from "../serverEvents/handleServerLogs.js";

export default async (client, channel) => {
  if (!channel.guild) return;

  const auditLogs = await channel.guild.fetchAuditLogs({
    limit: 1,
    type: AuditLogEvent.ChannelCreate,
  });
  const log = auditLogs.entries.first();

  await handleServerLogs(client, channel.guild, AuditLogEvent.ChannelCreate, {
    target: channel,
    executor: log?.executor || client.user,
    changes: [
      {
        name: channel.name,
        type: channel.type,
        category: channel.parent?.name || "None",
      },
    ],
  });
};
