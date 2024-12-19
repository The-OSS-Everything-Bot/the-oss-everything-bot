import handleServerLogs from "../serverEvents/handleServerLogs.js";

export default async (client, role) => {
  await handleServerLogs(client, role.guild, "ROLE_DELETE");
};
