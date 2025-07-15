import { Bot } from 'grammy';
import { fetchRecentMessages } from '../utils/telegram-helpers';

export default (bot: Bot) => {
  bot.command('summary', async ctx => {
    if (!ctx.message) return;

    const message = ctx.message;
    const chatID = ctx.chat.id.toString();
    const timestamp = new Date().toISOString();
    const threadID = ctx.message?.message_thread_id?.toString();

    const isDevMode = ctx.env.DEV_MODE === '1';

    if (message.chat.type !== 'supergroup' && !(isDevMode && message.chat.type === 'private')) {
      console.warn(
        `[${timestamp}] Ignored /summary command in non-supergroup chat: ${message.chat.type}`
      );
      return;
    }

    ctx.replyWithChatAction('typing');

    const dbMessages = await fetchRecentMessages(ctx.env.DB, chatID, 200, threadID);

    if (dbMessages.length === 0) {
      ctx.reply('No messages found in this chat to summarize.', {
        reply_parameters: { message_id: ctx.message.message_id },
        parse_mode: 'HTML',
      });
      return;
    }

    ctx.reply('test');
  });
};
