import { Bot } from 'grammy';

export default (bot: Bot) => {
  bot.command('link', async ctx => {
    if (!ctx.message) return;
    const timestamp = new Date().toISOString();

    ctx.replyWithChatAction('typing');

    if (ctx.message.chat.type !== 'private') {
      console.warn(
        `[${timestamp}] Blocked: Someone tried to use /link command in supergroup: ${ctx.message.chat.type}`
      );
      ctx.reply(
        `🔒 For <b>security</b> reasons, the <b>/link</b> command can only be used in private messages with the bot. Please send me a direct message to link your account.`,
        {
          reply_parameters: { message_id: ctx.message.message_id },
          parse_mode: 'HTML',
        }
      );
      return;
    }

    // Extract the code from the message
    const userInput = ctx.message.text || '';
    const parts = userInput.trim().split(/\s+/);
    const code = parts[1];

    // Get user information for logging
    const displayName = ctx.message.from?.first_name
      ? `${ctx.message.from.first_name}${ctx.message.from.last_name ? ' ' + ctx.message.from.last_name : ''}`
      : ctx.message.from?.username || 'Unknown User';
    const userId = ctx.message.from?.id.toString() || 'Unknown ID';

    const feedback = `<b>🔐 Usage:</b>\n<pre>/link code</pre>\nThe code must be exactly 9 characters long and contain both letters and numbers.`;

    if (parts.length <= 1) {
      ctx.reply(feedback, {
        reply_parameters: { message_id: ctx.message.message_id },
        parse_mode: 'HTML',
      });
      return;
    }

    if (
      code.length !== 9 ||
      !/^[a-zA-Z0-9]+$/.test(code) ||
      !/(.*[a-zA-Z].*[0-9]|.*[0-9].*[a-zA-Z])/.test(code)
    ) {
      ctx.reply(feedback, {
        reply_parameters: { message_id: ctx.message.message_id },
        parse_mode: 'HTML',
      });
      return;
    }

    // Call the API to validate the code
    const apiUrl = `https://khmercoder.com/api/account/link/${code}`;

    interface ApiResponse {
      success: boolean;
      userId: string;
    }

    try {
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }
      const data: ApiResponse = await response.json();

      if (data.success) {
        console.log(
          `[${timestamp}] Attempting to link account with code: ${code} for user: ${displayName} (${userId})`
        );

        try {
          await ctx.env.DB.prepare(
            `INSERT INTO users(platform, user_id, display_name, linked_user_id)
             VALUES(?, ?, ?, ?)
             ON CONFLICT(platform, user_id)
             DO UPDATE SET linked_user_id = excluded.linked_user_id, display_name = excluded.display_name`
          )
            .bind('telegram', userId, displayName, data.userId)
            .run();

          ctx.reply(`🎉 <b>Account linked successfully!</b>\nThank you for using KhmerCoders!`, {
            parse_mode: 'HTML',
          });
        } catch (dbError) {
          console.error(`[${timestamp}] Database error linking account:`, dbError);
          ctx.reply(`❌ An error occurred while linking your account. Please try again later.`);
        }
      } else {
        ctx.reply(`❌ Failed to link account. Please try again.`);
      }
    } catch (apiError) {
      console.error(`[${timestamp}] API error linking account:`, apiError);
      ctx.reply(`❌ An error occurred while linking your account. Please try again later.`);
    }
  });
};
