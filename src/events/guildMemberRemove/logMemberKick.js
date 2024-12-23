import { AuditLogEvent } from "discord.js";
import handleServerLogs from "../serverEvents/handleServerLogs.js";

export default async (client, member) => {
  const auditLogs = await member.guild.fetchAuditLogs({
    limit: 1,
    type: AuditLogEvent.MemberKick,
  });
  const log = auditLogs.entries.first();

  if (
    log &&
    log.target.id === member.user.id &&
    log.createdTimestamp > Date.now() - 5000
  ) {
    await handleServerLogs(client, member.guild, AuditLogEvent.MemberKick, {
      target: member.user,
      executor: log?.executor || client.user,
      reason: log?.reason || "No reason provided",
    });
  }
};
