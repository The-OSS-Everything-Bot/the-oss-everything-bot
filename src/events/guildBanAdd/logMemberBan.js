import { AuditLogEvent } from "discord.js";
import handleServerLogs from "../serverEvents/handleServerLogs.js";

export default async (client, ban) => {
  const auditLogs = await ban.guild.fetchAuditLogs({
    limit: 1,
    type: AuditLogEvent.MemberBanAdd,
  });
  const log = auditLogs.entries.first();

  if (
    log &&
    log.target.id === ban.user.id &&
    log.createdTimestamp > Date.now() - 5000
  ) {
    await handleServerLogs(client, ban.guild, AuditLogEvent.MemberBanAdd, {
      target: ban.user,
      executor: log?.executor || client.user,
      reason: log?.reason,
    });
  }
};
