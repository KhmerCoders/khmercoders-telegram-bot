-- Migration file for kcc-chatbot database
-- Create users table
CREATE TABLE users (
  platform TEXT NOT NULL,           -- 'telegram', 'discord', etc.
  user_id INTEGER NOT NULL,         -- platform-specific user ID
  display_name TEXT NOT NULL,
  linked_user_id TEXT,              -- Optional external user ID (e.g., UUID from your main DB)
  PRIMARY KEY (platform, user_id)
);

-- Create chat_counter table
CREATE TABLE chat_counter (
  chat_date TEXT NOT NULL,          -- 'YYYY-MM-DD'
  platform TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  message_count INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (chat_date, platform, user_id)
);

-- Create index for faster lookups by linked_user_id
CREATE INDEX idx_users_linked_user_id ON users (linked_user_id);
