import { Bot, webhookCallback } from 'grammy';
import commands from './commands';
import { countUserMessage } from './utils/db-helpers';

export interface Env {
  BOT_TOKEN: string;
  DB: D1Database;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const WEBHOOK_PATH = '/webhook/telegram';

    // Check if the request path matches your webhook path
    if (url.pathname === WEBHOOK_PATH) {
      const bot = new Bot(env.BOT_TOKEN);

      commands(bot);

      await bot.api.setMyCommands([
        { command: 'help', description: 'Show help text' },
        { command: 'ping', description: `🏓 Check if I'm alive` },
        { command: 'summary', description: `📝 Summarize recent chat messages` },
        { command: 'link', description: `🔗 Link your Telegram account (private messages only)` },
      ]);

      // Register the message counter middleware
      bot.use(async (ctx, next) => {
        // Only process if it's a regular message with text content
        if (!ctx.has('message:text')) {
          // Don't count service messages (join/leave, group title changes, etc.)
          if (
            ctx.message?.new_chat_members ||
            ctx.message?.left_chat_member ||
            ctx.message?.new_chat_title ||
            ctx.message?.new_chat_photo ||
            ctx.message?.delete_chat_photo ||
            ctx.message?.group_chat_created ||
            ctx.message?.supergroup_chat_created ||
            ctx.message?.channel_chat_created ||
            ctx.message?.message_auto_delete_timer_changed ||
            ctx.message?.pinned_message
          ) {
            console.log(`Ignoring service message (join/leave/pin/etc)`);
          }
          return next();
        }

        const message = ctx.message;
        const userId = message.from.id.toString();
        const displayName =
          message.from.first_name + (message.from.last_name ? ` ${message.from.last_name}` : '');
        const messageLength = message.text.length;

        try {
          await countUserMessage(env.DB, 'telegram', userId, displayName, messageLength);
        } catch (error) {
          console.error('Error counting user message:', error);
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
