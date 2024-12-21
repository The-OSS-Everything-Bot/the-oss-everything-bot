import { AuditLogEvent } from "discord.js";
import handleServerLogs from "../serverEvents/handleServerLogs.js";

export default async (client, role) => {
  const auditLogs = await role.guild.fetchAuditLogs({
    limit: 1,
    type: AuditLogEvent.RoleCreate,
  });
  const log = auditLogs.entries.first();

  await handleServerLogs(client, role.guild, AuditLogEvent.RoleCreate, {
    target: role,
    executor: log?.executor || client.user,
    changes: [
      {
        name: role.name,
        color: role.color,
        permissions: role.permissions.toArray(),
      },
    ],
  });
};
