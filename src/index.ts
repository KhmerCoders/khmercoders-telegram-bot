import { Bot, webhookCallback } from 'grammy';
import commands from './commands';

export interface Env {
  BOT_TOKEN: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const bot = new Bot(env.BOT_TOKEN);

    commands(bot);

    await bot.api.setMyCommands([
      { command: 'help', description: 'Show help text' },
      { command: 'ping', description: `🏓 Check if I'm alive` },
      { command: 'summary', description: `📝 Summarize recent chat messages` },
      { command: 'link', description: `🔗 Link your Telegram account (private messages only)` },
    ]);

    return webhookCallback(bot, 'cloudflare-mod')(request);
  },
} satisfies ExportedHandler<Env>;
