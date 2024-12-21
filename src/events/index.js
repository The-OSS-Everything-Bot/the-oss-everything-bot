import { Events } from "discord.js";
import handlePrefixCommands from "./messageCreate/handlePrefixCommands.js";
import handleLogs from "./messageCreate/handleLogs.js";
import logMessageDelete from "./messageDelete/logMessageDelete.js";
import logMessageBulkDelete from "./messageDeleteBulk/logMessageBulkDelete.js";
import logMemberUpdate from "./guildMemberUpdate/logMemberUpdate.js";

export default {
  [Events.MessageCreate]: [handlePrefixCommands, handleLogs],
  [Events.MessageDelete]: [logMessageDelete],
  [Events.MessageBulkDelete]: [logMessageBulkDelete],
  [Events.GuildMemberUpdate]: [logMemberUpdate],
};
