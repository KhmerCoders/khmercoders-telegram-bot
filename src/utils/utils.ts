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

/**
 * Record a message from a Telegram supergroup (or private chat in dev mode) in the database
 *
 * @param db - D1Database instance
 * @param message - The Telegram message object
 * @param devMode - boolean, true if DEV_MODE is enabled
 * @returns Promise<void>
 */
import { Message } from 'grammy/types';
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

/**
 * Generate a summary of chat messages using Cloudflare AI
 *
 * @param messages - Array of chat messages
 * @param ai - Cloudflare AI instance
 * @returns Promise<string> - The generated summary
 */
export async function GenerateAISummary(
  userPrompt: string,
  messages: Array<{
    message_text: string;
    sender_name: string;
    message_date: string;
  }>,
  ai: Ai<AiModels>
): Promise<string> {
  try {
    // Build a conversation history to summarize
    const conversationHistory = messages
      .reverse() // Order from oldest to newest
      .map(msg => {
        // Format date for display - convert ISO date to more readable format
        const date = new Date(msg.message_date);
        const formattedDate = date.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });
        return `[${formattedDate}] ${msg.sender_name}: ${msg.message_text}`;
      })
      .join('\n');

    // Prepare the AI messages based on whether there's a custom user prompt
    const aiMessages = [
      {
        role: 'system',
        content: `
        You are Khmercoders assistant. Your main task is to provide brief 50 - 100 words, easy-to-read summaries of chat history.
        
        ---
        Format Guidelines

        When you respond, use these HTML tags for formatting:
        - Use <b>text</b> for bold formatting (important topics, names)
        - Use <i>text</i> for italic formatting (emphasis, side notes)
        - Use <code>text</code> for inline code, commands, or technical terms
        - Use <pre>text</pre> for code blocks (if needed)
        - Use <tg-spoiler>text</tg-spoiler> for spoilers or sensitive content
        - Use <u>text</u> for underlined text (sparingly)
        
        Example: "<b>Main Topics:</b> The discussion covered <i>project updates</i> and <code>/deploy</code> commands."
        
        IMPORTANT: Content will be automatically sanitized for security, so use HTML tags freely.
        ---

        ---
        Custom Query Handling:

        If the user provides a specific query or request after /summary, focus your summary on that aspect while still providing context.
        
        Examples:
        - "/summary focus on technical discussions" → Focus on technical topics
        - "/summary what decisions were made?" → Focus on decisions and conclusions
        - "/summary who participated most?" → Focus on participant activity
        - "/summary any issues mentioned?" → Focus on problems and issues
        
        If no specific query is provided, give a general balanced summary.
        ---

        ---
        Your Restrictions:

        Summaries Only: Your primary purpose is to summarize chat conversations. Make sure summaries are short and concise for quick reading.

        "Who are you?" Exception: If someone asks "Who are you?", you can briefly state that you are the Khmercoders Assistant.

        No Other Topics: Do not answer any other questions or engage in conversations outside of summarizing chats or stating your identity. Politely decline if asked to do anything else.
        ---
        `,
      },
    ];

    // Add the conversation content
    if (userPrompt && userPrompt.trim().length > 0) {
      // User provided a specific query
      aiMessages.push({
        role: 'user',
        content: `Here are ${messages.length} Telegram messages to summarize:\n\n${conversationHistory}\n\nSpecific request: ${userPrompt}`,
      });
    } else {
      // No specific query, general summary
      aiMessages.push({
        role: 'user',
        content: `Summarize the following ${messages.length} Telegram messages:\n\n${conversationHistory}`,
      });
    }

    // Call Cloudflare AI to generate summary
    const response = (await ai.run(
      '@cf/meta/llama-3.3-70b-instruct-fp8-fast',
      {
        messages: aiMessages,
      },
      {
        // CLOUDFLARE AI GATEWAY: IMPORTANT
        gateway: {
          id: 'khmercoders-bot-summary-gw',
        },
      }
    )) as AiTextGenerationOutput;

    // Check if the response is a ReadableStream (which we can't directly use)
    if (response instanceof ReadableStream) {
      console.warn('Received ReadableStream response which cannot be processed');
      const fallbackMessage = "Sorry, I couldn't generate a summary at this time.";
      return convertMarkdownToHTML(fallbackMessage);
    }

    // Return the response if available with proper HTML formatting
    const rawResponse = response?.response || 'No summary generated';
    // console.log('Raw AI response:', rawResponse);

    // Convert Markdown to HTML first, then sanitize for Telegram
    const markdownConverted = convertMarkdownToHTML(rawResponse);
    // console.log('Markdown converted response:', markdownConverted);

    return formatTelegramHTML(markdownConverted);
  } catch (error) {
    console.error(`Error generating summary:`, error);

    // Provide a fallback summary when AI fails
    const fallbackSummary = generateFallbackSummary(messages, userPrompt);
    const fallbackConverted = convertMarkdownToHTML(fallbackSummary);
    return formatTelegramHTML(fallbackConverted);
  }
}

/**
 * Convert common Markdown formatting to HTML for Telegram
 * The reason : sometime AI will send markdown formatting and we need to convert it to HTML to allow it to be displayed correctly.
 *
 * @param text - Text with potential Markdown formatting
 * @returns Text with HTML formatting
 */
function convertMarkdownToHTML(text: string): string {
  try {
    // Convert **bold** and __bold__ to <b>bold</b>
    text = text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    text = text.replace(/__(.*?)__/g, '<b>$1</b>');

    // Convert *italic* and _italic_ to <i>italic</i>
    text = text.replace(/\*(.*?)\*/g, '<i>$1</i>');
    text = text.replace(/_(.*?)_/g, '<i>$1</i>');

    // Convert `code` to <code>code</code>
    text = text.replace(/`(.*?)`/g, '<code>$1</code>');

    // Convert ```code blocks``` to <pre>code</pre>
    text = text.replace(/```([\s\S]*?)```/g, '<pre>$1</pre>');

    // Convert ~~strikethrough~~ to <s>strikethrough</s>
    text = text.replace(/~~(.*?)~~/g, '<s>$1</s>');

    return text;
  } catch (error) {
    console.error('Error converting Markdown to HTML:', error);
    return text;
  }
}

/**
 * Sanitize and format HTML content for Telegram messages
 *
 * @param htmlContent - Raw HTML content
 * @returns Sanitized HTML string safe for Telegram
 */
function formatTelegramHTML(htmlContent: string): string {
  try {
    // Telegram's allowed HTML tags
    const telegramAllowedTags = [
      'b',
      'strong',
      'i',
      'em',
      'u',
      'ins',
      's',
      'strike',
      'del',
      'code',
      'pre',
      'a',
      'tg-spoiler',
    ];

    // First, escape all HTML entities to prevent XSS
    let sanitized = htmlContent
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');

    // Re-allow only Telegram's supported HTML tags
    telegramAllowedTags.forEach(tag => {
      // Allow opening tags
      const openTagRegex = new RegExp(`&lt;${tag}&gt;`, 'gi');
      sanitized = sanitized.replace(openTagRegex, `<${tag}>`);

      // Allow closing tags
      const closeTagRegex = new RegExp(`&lt;\\/${tag}&gt;`, 'gi');
      sanitized = sanitized.replace(closeTagRegex, `</${tag}>`);
    });

    // Handle special case for <a> tags with href attribute
    // Pattern: &lt;a href=&quot;URL&quot;&gt; -> <a href="URL">
    sanitized = sanitized.replace(/&lt;a\s+href=&quot;([^&"]+)&quot;&gt;/gi, '<a href="$1">');

    // Handle closing </a> tags
    sanitized = sanitized.replace(/&lt;\/a&gt;/gi, '</a>');

    // Validate that tags are properly nested and remove malformed ones
    sanitized = validateAndCleanTelegramHTML(sanitized);

    return sanitized;
  } catch (error) {
    console.error('Error formatting HTML for Telegram:', error);
    // Return plain text fallback on error
    return htmlContent.replace(/<[^>]*>/g, '');
  }
}

/**
 * Generate a fallback summary when AI is unavailable
 *
 * @param messages - Array of chat messages
 * @param userPrompt - Optional user query
 * @returns Simple text summary
 */
function generateFallbackSummary(
  messages: Array<{
    message_text: string;
    sender_name: string;
    message_date: string;
  }>,
  userPrompt: string
): string {
  if (messages.length === 0) {
    return '<b>📭 No Messages:</b> <i>No messages found to summarize.</i>';
  }

  // Get unique participants
  const participants = [...new Set(messages.map(msg => msg.sender_name))];

  // Get date range
  const dates = messages.map(msg => new Date(msg.message_date));
  const earliestDate = new Date(Math.min(...dates.map(d => d.getTime())));
  const latestDate = new Date(Math.max(...dates.map(d => d.getTime())));

  const formatDate = (date: Date) =>
    date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  // Create basic summary
  let summary = `<b>💬 Chat Activity Summary</b>\n\n`;
  summary += `<b>📊 Stats:</b>\n`;
  summary += `• <i>Messages:</i> ${messages.length}\n`;
  summary += `• <i>Participants:</i> ${participants.length} (${participants.join(', ')})\n`;
  summary += `• <i>Time Range:</i> ${formatDate(earliestDate)} - ${formatDate(latestDate)}\n\n`;

  if (userPrompt && userPrompt.trim().length > 0) {
    summary += `<b>🔍 Query:</b> <i>"${userPrompt}"</i>\n\n`;
    summary += `<b>📝 Note:</b> <i>AI summarization is temporarily unavailable. Please try again later for detailed analysis.</i>`;
  } else {
    summary += `<b>📝 Note:</b> <i>AI summarization is temporarily unavailable. Showing basic chat statistics instead.</i>`;
  }

  return summary;
}

/**
 * Validate and clean Telegram HTML to ensure proper tag nesting
 *
 * @param html - HTML string to validate
 * @returns Cleaned HTML string
 */
function validateAndCleanTelegramHTML(html: string): string {
  try {
    // Remove any tags that are not properly closed or nested
    // This is a simple validation - for more complex validation, we'd need a proper HTML parser

    // Remove empty tags
    html = html.replace(/<(b|strong|i|em|u|ins|s|strike|del|code|pre|tg-spoiler)><\/\1>/gi, '');

    // Remove nested identical tags (Telegram doesn't support nested formatting of same type)
    const tagsToCheck = [
      'b',
      'strong',
      'i',
      'em',
      'u',
      'ins',
      's',
      'strike',
      'del',
      'code',
      'tg-spoiler',
    ];

    tagsToCheck.forEach(tag => {
      // Remove nested identical tags: <b><b>text</b></b> -> <b>text</b>
      const nestedRegex = new RegExp(
        `<${tag}>([^<]*)<${tag}>([^<]*)<\\/${tag}>([^<]*)<\\/${tag}>`,
        'gi'
      );
      html = html.replace(nestedRegex, `<${tag}>$1$2$3</${tag}>`);
    });

    return html;
  } catch (error) {
    console.error('Error validating Telegram HTML:', error);
    return html;
  }
}
