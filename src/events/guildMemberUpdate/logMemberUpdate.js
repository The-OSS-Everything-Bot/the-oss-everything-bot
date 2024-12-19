import handleServerLogs from "../serverEvents/handleServerLogs.js";

export default async (client, oldMember, newMember) => {
  if (!oldMember?.roles || !newMember?.roles) return;

  const changes = [];

  if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
    changes.push("roles");
  }

  if (oldMember.nickname !== newMember.nickname) {
    changes.push("nickname");
  }

  if (
    oldMember.communicationDisabledUntil !==
    newMember.communicationDisabledUntil
  ) {
    changes.push("timeout");
  }

  if (changes.length > 0) {
    await handleServerLogs(client, newMember.guild, "MEMBER_UPDATE");
  }
};
