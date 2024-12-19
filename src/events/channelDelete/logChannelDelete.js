import handleServerLogs from "../serverEvents/handleServerLogs.js";

export default async (client, channel) => {
  if (!channel.guild) return;
  await handleServerLogs(client, channel.guild, "CHANNEL_DELETE");
};
