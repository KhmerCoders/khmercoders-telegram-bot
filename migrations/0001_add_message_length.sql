-- Migration to add message_length column to chat_counter table
ALTER TABLE chat_counter ADD COLUMN message_length INTEGER NOT NULL DEFAULT 0;