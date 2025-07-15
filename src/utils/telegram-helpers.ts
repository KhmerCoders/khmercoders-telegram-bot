import { Message } from 'grammy/types';

/**
 * Record a message from a Telegram channel or supergroup in the database
 *
 * @param db - D1Database instance
 * @param message - The Telegram message object
 * @returns Promise<void>
 */
export async function recordTelegramChannelMessage(
  db: D1Database,
  message: Message
): Promise<void> {
  try {
    const timestamp = new Date().toISOString();
    // Convert Telegram timestamp to ISO format
    const messageDate = new Date(message.date * 1000).toISOString();

    const chatId = message.chat.id.toString();
    const chatType = message.chat.type;
    const chatTitle = message.chat.title || 'Unknown Channel';

    // Get sender info if available
    const senderId = message.from ? message.from.id.toString() : null;
    let senderName = 'Unknown User';
    if (message.from) {
      senderName = message.from.first_name
        ? `${message.from.first_name}${message.from.last_name ? ' ' + message.from.last_name : ''}`
        : message.from.username || 'Unknown User';
    }

    console.log(`[${timestamp}] Recording ${chatType} message from chat: ${chatTitle} (${chatId})`); // Determine media type if any
    let mediaType = null;
    if (message.photo) mediaType = 'photo';
    if (message.video) mediaType = 'video';
    if (message.document) mediaType = 'document';
    if (message.audio) mediaType = 'audio';

    // Handle forwarded message info
    const forwardedFrom = message.forward_origin;

    let fromName = 'Unknown';

    if (forwardedFrom?.type === 'user') {
      // Message was forwarded from a user
      const user = forwardedFrom.sender_user;
      fromName = user.first_name + (user.last_name ? ` ${user.last_name}` : '');
    } else if (forwardedFrom?.type === 'chat') {
      // Message was forwarded from a chat or channel
      const chat = forwardedFrom.sender_chat;
      fromName = chat.title ?? chat.username ?? `Chat ${chat.id}`;
    } else if (forwardedFrom?.type === 'hidden_user') {
      // Message was forwarded from a user who hides their account
      fromName = forwardedFrom.sender_user_name;
    }

    // Handle reply to message
    const replyToMessageId = message.reply_to_message?.message_id?.toString() || null;

    // Get message thread ID if it exists
    const messageThreadId = message.message_thread_id?.toString() || null;

    // Insert message into the database
    await db
      .prepare(
        `INSERT INTO telegram_channel_messages (
          message_id,
          chat_id,
          chat_type,
          chat_title,
          sender_id,
          sender_name,
          message_text,
          message_date,
          media_type,
          forwarded_from,
          reply_to_message_id,
          message_thread_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        message.message_id.toString(),
        chatId,
        chatType,
        chatTitle,
        senderId,
        senderName,
        message.text || '',
        messageDate,
        mediaType,
        forwardedFrom || '',
        replyToMessageId,
        messageThreadId
      )
      .run();

    console.log(`[${timestamp}] Successfully recorded ${chatType} message from: ${chatTitle}`);
  } catch (error) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] Error recording channel message:`, error);
    throw error;
  }
}

/**
 * Fetch recent messages from a Telegram chat
 *
 * @param db - D1Database instance
 * @param chatId - The chat ID to fetch messages from
 * @param threadId - Optional thread ID to filter messages by thread
 * @param limit - The maximum number of messages to fetch
 * @returns Promise<Array<{ message_text: string, sender_name: string, message_date: string, message_thread_id: string }>>

 */
export async function fetchRecentMessages(
  db: D1Database,
  chatId: string,
  limit: number = 200,
  threadId?: string
): Promise<
  Array<{
    message_text: string;
    sender_name: string;
    message_date: string;
    message_thread_id?: string;
  }>
> {
  try {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] Attempting to fetch recent messages for chat: ${chatId}`);

    let query = `SELECT message_text, sender_name, message_date, message_thread_id FROM telegram_channel_messages
                WHERE chat_id = ? AND message_text != ''`;

    const params = [chatId];
    // Add thread filter if threadId is provided
    if (threadId) {
      query += ` AND message_thread_id = ?`;
      params.push(threadId);
    }

    query += ` ORDER BY message_date DESC LIMIT ?`;
    params.push(limit.toString());

    const messages = await db
      .prepare(query)
      .bind(...params)
      .all();

    console.log(`[${timestamp}] Successfully fetched messages for summarization!`);

    return messages.results as Array<{
      message_text: string;
      sender_name: string;
      message_date: string;
      message_thread_id?: string;
    }>;
  } catch (error) {
    console.error(`Error fetching messages:`, error);
    throw error;
  }
}
