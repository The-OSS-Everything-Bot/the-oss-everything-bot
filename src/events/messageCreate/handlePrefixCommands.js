import handlePrefixCommands from "../../utils/handlePrefixCommands.js";

export default async (client, message) => {
  await handlePrefixCommands(client, message);
};
