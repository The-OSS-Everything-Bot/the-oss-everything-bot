import { Client, GatewayIntentBits } from "discord.js";
import env from "dotenv";
import eventHandler from "./src/handlers/eventHandler.js";
import { readFileSync } from "fs";
import express from "express";
import bodyParser from "body-parser";
import { createClient } from 'redis';
import { createClient as createLibSQL } from '@libsql/client';
import path from 'path';
import getAllFiles from "./src/utils/getAllFiles.js";

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
      const migrationFiles =  getAllFiles(path.join('./', 'migrations')).map(migration => readFileSync(migration).toString());
      
      for (const migration of migrationFiles) {
        try {
          await libsql.execute(migration);
        } catch (error) {
          console.warn('[Warn] Migration failed:', error);
        }
      }
      console.log('[Info] LibSQL migrations completed');
    } catch (migrationError) {
      console.warn('[Warn] Migration may have already been applied:', migrationError.message);
    }

    return { libsql };
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

startServer();

eventHandler(client);

client.login(process.env.BOT_TOKEN);
