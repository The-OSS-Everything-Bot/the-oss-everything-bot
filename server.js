import { Client, GatewayIntentBits } from "discord.js";
import env from "dotenv";
import eventHandler from "./src/handlers/eventHandler.js";
import { readFileSync, writeFileSync } from "fs";

import express from "express";
import bodyParser from "body-parser";

// import mongoose from "mongoose";

const app = express();
app.use(bodyParser.json());

app.post("/webhook", (req, res) => {
  req.body["type"] == 0;
  return res.status(204).send();
});

app.listen(3000, () => {
  console.log("[Info] express Server is running on port 3000!");
});

env.config();

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildModeration,
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
