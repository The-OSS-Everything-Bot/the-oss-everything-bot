import { AuditLogEvent } from "discord.js";
import handleServerLogs from "../serverEvents/handleServerLogs.js";

export default async (client, oldRole, newRole) => {
  if (!oldRole?.guild || !newRole?.guild) return;

  const changes = [];
  const auditLogs = await newRole.guild.fetchAuditLogs({
    limit: 1,
    type: AuditLogEvent.RoleUpdate,
  });
  const log = auditLogs.entries.first();

  if (oldRole.name !== newRole.name) {
    changes.push(`Name: ${oldRole.name} → ${newRole.name}`);
  }

  if (oldRole.color !== newRole.color) {
    changes.push(
      `Color: ${oldRole.color.toString(16)} → ${newRole.color.toString(16)}`
    );
  }

  if (oldRole.hoist !== newRole.hoist) {
    changes.push(`Hoisted: ${oldRole.hoist} → ${newRole.hoist}`);
  }

  if (oldRole.mentionable !== newRole.mentionable) {
    changes.push(
      `Mentionable: ${oldRole.mentionable} → ${newRole.mentionable}`
    );
  }

  if (changes.length > 0) {
    await handleServerLogs(client, newRole.guild, AuditLogEvent.RoleUpdate, {
      target: newRole,
      executor: log?.executor || client.user,
      reason: log?.reason,
      changes,
    });
  }
};
