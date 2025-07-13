-- Migration file to convert user_id from INTEGER to TEXT in all tables
-- Create temporary tables
CREATE TABLE temp_users (
  platform TEXT NOT NULL,
  user_id TEXT NOT NULL,         -- Changed from INTEGER to TEXT
  display_name TEXT NOT NULL,
  linked_user_id TEXT,
  PRIMARY KEY (platform, user_id)
);

CREATE TABLE temp_chat_counter (
  chat_date TEXT NOT NULL,
  platform TEXT NOT NULL,
  user_id TEXT NOT NULL,         -- Changed from INTEGER to TEXT
  message_count INTEGER NOT NULL DEFAULT 0,
  message_length INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (chat_date, platform, user_id)
);

-- Copy data with conversion
INSERT INTO temp_users (platform, user_id, display_name, linked_user_id)
SELECT platform, CAST(user_id AS TEXT), display_name, linked_user_id
FROM users;

INSERT INTO temp_chat_counter (chat_date, platform, user_id, message_count, message_length)
SELECT chat_date, platform, CAST(user_id AS TEXT), message_count, message_length
FROM chat_counter;

-- Drop original tables
DROP TABLE users;
DROP TABLE chat_counter;

-- Rename temporary tables to original names
ALTER TABLE temp_users RENAME TO users;
ALTER TABLE temp_chat_counter RENAME TO chat_counter;

-- Recreate the index
CREATE INDEX idx_users_linked_user_id ON users (linked_user_id);
