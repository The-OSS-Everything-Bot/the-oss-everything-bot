import { Client, GatewayIntentBits } from "discord.js";
import env from "dotenv";
import eventHandler from "./src/handlers/eventHandler.js";
import { readFileSync, writeFileSync } from "fs";
// import mongoose from "mongoose";

env.config();

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates
  ],
});

// connect to DB
//#(async () => {
//  mongoose.set("strictQuery", false);
//  await mongoose.connect(process.env.MONGO_URI);
//
//  console.log("[Info] Connected to MongoDB");
//})();

// checks if settings.json exists
try {
  readFileSync("./settings.json");
// eslint-disable-next-line no-unused-vars
} catch (err) {
  writeFileSync("./settings.json", "{}");
}

eventHandler(client);

client.login(process.env.BOT_TOKEN);
