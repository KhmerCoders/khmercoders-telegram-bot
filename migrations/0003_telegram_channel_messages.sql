-- Migration file to create a table for recording Telegram channel/supergroup messages
-- Create telegram_channel_messages table
CREATE TABLE telegram_channel_messages (
  message_id TEXT NOT NULL,         -- Telegram message ID
  chat_id TEXT NOT NULL,            -- Telegram chat ID (channel or supergroup)
  chat_type TEXT NOT NULL,          -- 'channel' or 'supergroup'
  chat_title TEXT NOT NULL,         -- Name of the channel or supergroup
  sender_id TEXT,                   -- Sender user ID if available (might be null for channel posts)
  sender_name TEXT,                 -- Sender display name if available
  message_text TEXT,                -- Message content
  message_date TEXT NOT NULL,       -- ISO format timestamp
  media_type TEXT,                  -- Type of media if any (photo, video, document, etc.)
  forwarded_from TEXT,              -- Original source if message is forwarded
  reply_to_message_id TEXT,         -- ID of message being replied to (if any)
  PRIMARY KEY (chat_id, message_id)
);

-- Create indexes for faster lookups
CREATE INDEX idx_telegram_channel_messages_date ON telegram_channel_messages (message_date);
CREATE INDEX idx_telegram_channel_messages_sender ON telegram_channel_messages (sender_id);
CREATE INDEX idx_telegram_channel_messages_chat_type ON telegram_channel_messages (chat_type);
