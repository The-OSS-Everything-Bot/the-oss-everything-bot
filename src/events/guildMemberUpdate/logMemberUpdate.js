import { AuditLogEvent } from "discord.js";
import handleServerLogs from "../serverEvents/handleServerLogs.js";

export default async (client, oldMember, newMember) => {
  if (!oldMember || !newMember) return;

  const changes = [];
  const auditLogs = await newMember.guild.fetchAuditLogs({
    limit: 1,
    type: AuditLogEvent.MemberUpdate,
  });
  const log = auditLogs.entries.first();

  if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
    const addedRoles = newMember.roles.cache.filter(
      (role) => !oldMember.roles.cache.has(role.id)
    );
    const removedRoles = oldMember.roles.cache.filter(
      (role) => !newMember.roles.cache.has(role.id)
    );

    if (addedRoles.size)
      changes.push(`Added roles: ${addedRoles.map((r) => r.name).join(", ")}`);
    if (removedRoles.size)
      changes.push(
        `Removed roles: ${removedRoles.map((r) => r.name).join(", ")}`
      );
  }

  if (oldMember.nickname !== newMember.nickname) {
    changes.push(
      `Nickname: ${oldMember.nickname || "None"} → ${newMember.nickname || "None"}`
    );
  }

  if (
    oldMember.communicationDisabledUntil !==
    newMember.communicationDisabledUntil
  ) {
    if (newMember.communicationDisabledUntil) {
      changes.push(
        `Timed out until: ${newMember.communicationDisabledUntil.toLocaleString()}`
      );
    } else {
      changes.push("Timeout removed");
    }
  }

  if (changes.length > 0) {
    await handleServerLogs(
      client,
      newMember.guild,
      AuditLogEvent.MemberUpdate,
      {
        target: newMember.user,
        executor: log?.executor || client.user,
        reason: log?.reason,
        changes,
      }
    );
  }
};
