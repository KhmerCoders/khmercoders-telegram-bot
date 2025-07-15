import { Bot } from 'grammy';
import { fetchRecentMessages } from '../utils/telegram-helpers';
import { GenerateAISummary } from '../utils/utils';

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
      ctx.reply(`Sorry, <b>/summary</b> command only available on KhmerCoders Chat.`, {
        reply_parameters: { message_id: ctx.message.message_id },
        parse_mode: 'HTML',
      });
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

    // User message
    const userPrompt = message.text?.replace('/summary', '').trim() || '';

    // Generate Response
    const generatedSummary = await GenerateAISummary(userPrompt, dbMessages, ctx.env.AI);
    const currentDate = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const summaryText = `<b>📝 Chat Summary</b> (as of ${currentDate})\n\n${generatedSummary}`;

    ctx.reply(summaryText, {
      reply_parameters: { message_id: ctx.message.message_id },
      parse_mode: 'HTML',
    });

    console.log(
      `[${timestamp}] Summary sent to chat ${chatID} ${threadID ? `, thread ${threadID}` : ''}`
    );
  });
};
