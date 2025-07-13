import { Bot } from 'grammy';

export default (bot: Bot) => {
  bot.command('help', async ctx => {
    if (!ctx.message) return;
    const helpMessage = `<b>🤖 Bot Commands</b>

Here's a list of things I can do:

<code>/help</code> - 🆘 Show this help message
<code>/ping</code> - 🏓 Check if I'm alive
<code>/summary</code> - 📝 Summarize recent chat messages
<code>/link &lt;code&gt;</code> - 🔗 Link your Telegram account <i>(private messages only)</i>

Type a command to get started!`;
    await ctx.reply(helpMessage, {
      reply_parameters: { message_id: ctx.message.message_id },
      parse_mode: 'HTML',
    });
  });
};
