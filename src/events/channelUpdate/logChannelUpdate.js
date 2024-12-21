import { AuditLogEvent } from "discord.js";
import handleServerLogs from "../serverEvents/handleServerLogs.js";

export default async (client, oldChannel, newChannel) => {
  if (!oldChannel?.guild || !newChannel?.guild) return;

  const auditLogs = await newChannel.guild.fetchAuditLogs({
    limit: 1,
    type: AuditLogEvent.ChannelUpdate,
  });
  const log = auditLogs.entries.first();

  const changes = [];

  if (oldChannel.name !== newChannel.name) {
    changes.push(`Name: ${oldChannel.name} → ${newChannel.name}`);
  }

  if (oldChannel.type !== newChannel.type) {
    changes.push(`Type: ${oldChannel.type} → ${newChannel.type}`);
  }

  if (oldChannel.parent?.id !== newChannel.parent?.id) {
    changes.push(
      `Category: ${oldChannel.parent?.name || "None"} → ${newChannel.parent?.name || "None"}`
    );
  }

  if (changes.length > 0) {
    await handleServerLogs(
      client,
      newChannel.guild,
      AuditLogEvent.ChannelUpdate,
      {
        target: newChannel,
        executor: log?.executor || client.user,
        changes,
      }
    );
  }
};
