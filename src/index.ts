import { Bot, webhookCallback } from 'grammy';
import commands from './commands';
import { countUserMessage } from './utils/db-helpers';
import { recordTelegramMessage } from './utils/utils';
import { isServiceMessage } from './utils/utils';

export interface Env {
  BOT_TOKEN: string;
  DB: D1Database;
  AI: Ai;
  DEV_MODE?: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const WEBHOOK_PATH = '/webhook/telegram';
    const timestamp = new Date().toISOString();

    // Check if the request path matches your webhook path
    if (url.pathname === WEBHOOK_PATH) {
      const bot = new Bot(env.BOT_TOKEN);

      // Attach the env vars to the context
      bot.use((ctx, next) => {
        ctx.env = env;
        return next();
      });

      commands(bot);

      await bot.api.setMyCommands([
        { command: 'help', description: 'Show help text' },
        { command: 'ping', description: `🏓 Check if I'm alive` },
        { command: 'summary', description: `📝 Summarize recent chat messages` },
        { command: 'link', description: `🔗 Link your Telegram account (private messages only)` },
      ]);

      bot.use(async (ctx, next) => {
        // Only process if it's a regular message with text content
        if (!ctx.has('message:text')) {
          if (isServiceMessage(ctx.message)) {
            console.log(`[${timestamp}] Ignoring service message (join/leave/pin/etc)`);
          }
          return next();
        }

        const message = ctx.message;
        const userId = message.from.id.toString();
        const displayName =
          message.from.first_name + (message.from.last_name ? ` ${message.from.last_name}` : '');
        const messageLength = message.text.length;
        const chatType = message.chat.type;

        // Proccess count and record message only in group chats
        if (chatType === 'group' || chatType === 'supergroup') {
          try {
            // Count every message in supergroup chats
            await countUserMessage(env.DB, 'telegram', userId, displayName, messageLength);

            // Record every message in supergroup chats
            const isDevMode = env.DEV_MODE === '1';
            await recordTelegramMessage(env.DB, message, isDevMode);
          } catch (error) {
            console.error('Error counting or recording user message:', error);
          }
        }

        await next();
      });

      // Process the webhook update
      const handleUpdate = webhookCallback(bot, 'cloudflare-mod');
      return await handleUpdate(request);
    }

    // Handle other paths
    if (url.pathname === '/') {
      return new Response('Welcome to Khmercoders Telegram Bot!', { status: 200 });
    }

    // Return "Not Found" for any other path
    return new Response('Not Found', { status: 404 });
  },
} satisfies ExportedHandler<Env>;
