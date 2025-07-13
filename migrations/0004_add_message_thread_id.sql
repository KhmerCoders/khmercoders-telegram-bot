-- Migration file to add message_thread_id to telegram_channel_messages table
-- This column stores the thread ID for messages in forum-like groups
-- When a summary command is processed, it will respond to the same thread
ALTER TABLE telegram_channel_messages ADD COLUMN message_thread_id TEXT;

-- Create index for faster lookups by thread
CREATE INDEX idx_telegram_channel_messages_thread ON telegram_channel_messages (message_thread_id);
