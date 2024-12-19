import handleServerLogs from "../serverEvents/handleServerLogs.js";

export default async (client, oldMember, newMember) => {
  if (
    oldMember.roles.cache.size !== newMember.roles.cache.size ||
    oldMember.nickname !== newMember.nickname ||
    oldMember.communicationDisabledUntil !==
      newMember.communicationDisabledUntil
  ) {
    await handleServerLogs(client, newMember.guild, "MEMBER_UPDATE");
  }
};
