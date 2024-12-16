import { Client, GatewayIntentBits } from "discord.js";
import env from "dotenv";
import eventHandler from "./src/handlers/eventHandler.js";
import mongoose from "mongoose";

env.config();

// Create a new client instance
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

// connect to DB
(async () => {
  mongoose.set("strictQuery", false);
  await mongoose.connect(process.env.MONGO_URI);

  console.log("[Info] Connected to MongoDB");
})();

eventHandler(client);

client.login(process.env.BOT_TOKEN);
