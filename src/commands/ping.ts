import { Bot } from 'grammy';

export default (bot: Bot) => {
  bot.command('ping', async ctx => {
    if (!ctx.message) return;
    await ctx.reply('<b>pong</b>', {
      reply_parameters: { message_id: ctx.message.message_id },
      parse_mode: 'HTML',
    });
  });
};
