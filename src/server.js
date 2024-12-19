import { Client, GatewayIntentBits } from "discord.js";
import env from "dotenv";
import eventHandler from "./handlers/eventHandler.js";
import express from "express";
import bodyParser from "body-parser";
import { createClient } from "redis";
import { createClient as createLibSQL } from "@libsql/client";
import path from "path";
import { readFileSync } from "fs";

env.config();

const initDatabases = async () => {
  try {
    const redis = createClient({
      url: process.env.REDIS_URL || "redis://localhost:6379",
    });

    await redis.connect();
    console.log("[Info] Connected to Redis");

    const dbPath = path.join(process.cwd(), "local.db");
    const libsql = createLibSQL({
      url: process.env.LIBSQL_URL || `file:${dbPath}`,
      authToken: process.env.LIBSQL_AUTH_TOKEN,
    });

    try {
      const migrations = [
        "./migrations/001_create_users.sql",
        "./migrations/002_create_guild_settings.sql",
        "./migrations/003_create_tickets.sql",
        "./migrations/004_create_role_persistence.sql",
      ];

      for (const migration of migrations) {
        const migrationSQL = readFileSync(migration, "utf-8");
        try {
          await libsql.execute(migrationSQL);
          console.log(`[Info] Migration ${migration} completed`);
        } catch (migrationError) {
          if (!migrationError.message.includes("already exists")) {
            throw migrationError;
          }
        }
      }
    } catch (error) {
      console.error("[Error] Migration failed:", error);
      throw error;
    }

    return { redis, libsql };
  } catch (error) {
    console.error("[Error] Database initialization failed:", error);
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
    console.error("[Error] Server startup failed:", error);
    process.exit(1);
  }
};

startServer();
