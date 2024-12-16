import path from "path";

import getAllFiles from "../utils/getAllFiles.js";

export default (client) => {
  const eventFolders = getAllFiles(path.join("./", "src", "events"), true);

  for (const folder of eventFolders) {
    let eventFiles = getAllFiles(folder);
    let eventName = folder.replace(/\\/g, "/").split("/").pop();
    eventFiles.sort((a, b) => a > b);

    console.log(
      `[info] Loaded event ${
        eventFiles.length
      } in ${folder},\n[file] ${eventFiles.join("\n[file] ") || "Empty"} \n`
    );

    client.on(eventName, async (args) => {
      for (const file of eventFiles) {
        const event = await import(`../../${file}`);

        if (event.default) {
          event.default(client, args);
        } else {
          event(client, args);
        }
      }
    });
  }
};
