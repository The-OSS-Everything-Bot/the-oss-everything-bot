import { Client, GatewayIntentBits } from "discord.js";
import env from "dotenv";
import eventHandler from "./src/handlers/eventHandler.js";
import { readFileSync, writeFileSync } from "fs";
import express from "express";
import bodyParser from "body-parser";
import { createClient } from 'redis';
import { createClient as createLibSQL } from '@libsql/client';
import path from 'path';

env.config();

const initDatabases = async () => {
  try {
    const redis = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    await redis.connect();
    console.log('[Info] Connected to Redis');

    const dbPath = path.join(process.cwd(), 'local.db');
    const libsql = createLibSQL({
      url: process.env.LIBSQL_URL || `file:${dbPath}`,
      authToken: process.env.LIBSQL_AUTH_TOKEN
    });

    try {
      const migrationSQL = readFileSync('./migrations/001_create_users.sql', 'utf-8');
      await libsql.execute(migrationSQL);
      console.log('[Info] LibSQL migrations completed');
    } catch (migrationError) {
      console.warn('[Warn] Migration may have already been applied:', migrationError.message);
    }

    return { redis, libsql };
  } catch (error) {
    console.error('[Error] Database initialization failed:', error);
    process.exit(1);
  }
};

const app = express();
app.use(bodyParser.json());

app.post("/webhook", (req, res) => {
  req.body["type"] == 0;
  return res.status(204).send();
});

const startServer = async () => {
  try {
    const { redis, libsql } = await initDatabases();
    global.redis = redis;
    global.libsql = libsql;

    app.listen(3000, () => {
      console.log("[Info] Express Server is running on port 3000!");
    });

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

    try {
      readFileSync("./settings.json");
    } catch (err) {
      writeFileSync("./settings.json", "{}");
    }

    await client.login(process.env.BOT_TOKEN);
    await eventHandler(client);

  } catch (error) {
    console.error('[Error] Server startup failed:', error);
    process.exit(1);
  }
};

process.on('unhandledRejection', error => {
  console.error('Unhandled promise rejection:', error);
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
