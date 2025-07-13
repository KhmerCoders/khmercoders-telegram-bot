import { Bot } from 'grammy';

export default (bot: Bot) => {
  bot.command('start', async ctx => {
    if (!ctx.message) return;
    await ctx.reply('Try /help', { reply_parameters: { message_id: ctx.message.message_id } });
  });
};
