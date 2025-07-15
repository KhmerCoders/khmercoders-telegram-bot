// Utities for Telegram bot

// Check if a message is a service message
export function isServiceMessage(message: any): boolean {
  return Boolean(
    message?.new_chat_members ||
      message?.left_chat_member ||
      message?.new_chat_title ||
      message?.new_chat_photo ||
      message?.delete_chat_photo ||
      message?.group_chat_created ||
      message?.supergroup_chat_created ||
      message?.channel_chat_created ||
      message?.message_auto_delete_timer_changed ||
      message?.pinned_message
  );
}

import { Message } from 'grammy/types';

/**
 * Record a message from a Telegram supergroup (or private chat in dev mode) in the database
 *
 * @param db - D1Database instance
 * @param message - The Telegram message object
 * @param devMode - boolean, true if DEV_MODE is enabled
 * @returns Promise<void>
 */
export async function recordTelegramMessage(
  db: D1Database,
  message: Message,
  devMode = false // default if not provided
): Promise<void> {
  const chatType = message.chat.type;
  if (chatType !== 'supergroup' && !(devMode && chatType === 'private')) {
    const timestamp = new Date().toISOString();
    console.warn(`[${timestamp}] Ignore recording message from chat type:`, chatType);
    return;
  }

  // Check blacklist for message_thread_id
  if (message.message_thread_id) {
    const { isTelegramThreadIdInBlacklist } = await import('./db-helpers');
    const blacklisted = await isTelegramThreadIdInBlacklist(db, String(message.message_thread_id));
    if (blacklisted) {
      const timestamp = new Date().toISOString();
      console.warn(
        `[${timestamp}] Ignore recording message from blacklisted thread:`,
        message.message_thread_id
      );
      return;
    }
  }

  const { recordTelegramChannelMessage } = await import('./telegram-helpers');
  await recordTelegramChannelMessage(db, message);
}
