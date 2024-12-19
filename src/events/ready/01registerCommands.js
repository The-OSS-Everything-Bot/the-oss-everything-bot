import getApplicationCommands from "../../utils/getApplicationCommands.js";
import getLocalCommands from "../../utils/getLocalCommands.js";
import path from "path";

export default async (client) => {
  try {
    const localCommands = await getLocalCommands();
    const applicationCommands = await getApplicationCommands(client);

    for (const localCommand of localCommands) {
      await applicationCommands.create(localCommand.data);
    }
  } catch (error) {
    console.log(
      "\x1b[31m",
      `[Error] at ${path.basename("./01registerCommands.js")} ${error}`
    );
  }
};
