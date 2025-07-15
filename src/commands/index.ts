import { Bot, Context } from 'grammy';
import start from './start';
import ping from './ping';
import help from './help';

const withLogging = (commandName: string, commandFn: (bot: Bot) => void) => (bot: Bot) => {
  bot.use(async (ctx: Context, next) => {
    if (ctx.message?.text?.startsWith(`/${commandName}`)) {
      const userId = ctx.from?.id;
      const username = ctx.from?.username;
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] Command: /${commandName}, Called by: ${username || userId}`);
    }
    await next();
  });
  commandFn(bot);
};

export default (bot: Bot) => {
  withLogging('start', start)(bot);
  withLogging('ping', ping)(bot);
  withLogging('help', help)(bot);
};
