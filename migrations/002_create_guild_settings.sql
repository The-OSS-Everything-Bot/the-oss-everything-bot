CREATE TABLE IF NOT EXISTS guild_settings (
    guild_id TEXT PRIMARY KEY,
    log_channel_id TEXT,
    prefix TEXT,
    antiraid_enabled INTEGER DEFAULT 0,
    antiraid_jail_channel TEXT,
    antiraid_msg_threshold INTEGER DEFAULT 5,
    antiraid_time_window INTEGER DEFAULT 5,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_guild_settings_guild_id ON guild_settings(guild_id); 