import getAllFiles from "./getAllFiles.js";
import path from "path";

export default async (exceptions = []) => {
  let commands = [];

  const commandFolders = getAllFiles(path.join("./", "src", "commands"), true);

  for (const commandCategory of commandFolders) {
    const commandFiles = getAllFiles(commandCategory);

    for (const file of commandFiles) {
      const { default: command } = await import(`../../${file}`);

      if (exceptions.includes(command.data.name)) continue;

      commands.push(command);
    }

    console.log(
      `[info] Loaded ${commandFiles.length} commands in ${commandCategory}`
    );
    console.log(
      `[files] ${commandFiles.map((file) => file.split(/\\/).pop()).join(" ") || "Empty"}`
    );
  }

  return commands;
};
