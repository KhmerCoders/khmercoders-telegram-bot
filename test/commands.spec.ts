import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Bot } from 'grammy';

import pingCommand from '../src/commands/ping';
import helpCommand from '../src/commands/help';
import startCommand from '../src/commands/start';

describe('Bot Commands', () => {
  let mockBot: Bot;
  let mockCtx: any;

  beforeEach(() => {
    mockBot = new Bot('test-token');
    mockCtx = {
      message: {
        message_id: 123,
        from: { id: 456, is_bot: false, first_name: 'Test', last_name: 'User' },
        chat: { id: 789, type: 'private' },
        date: Date.now() / 1000,
        text: '',
      },
      reply: vi.fn(),
    };

    // Mock the bot.command method to directly call the handler
    vi.spyOn(mockBot, 'command').mockImplementation((commandName, handler) => {
      if (commandName === 'ping') {
        handler(mockCtx);
      } else if (commandName === 'help') {
        handler(mockCtx);
      } else if (commandName === 'start') {
        handler(mockCtx);
      }
      return mockBot;
    });
  });

  it('should respond with "pong" for the /ping command', async () => {
    pingCommand(mockBot);
    expect(mockCtx.reply).toHaveBeenCalledWith('<b>pong</b>', {
      reply_parameters: { message_id: mockCtx.message.message_id },
      parse_mode: 'HTML',
    });
  });

  it('should respond with the help message for the /help command', async () => {
    helpCommand(mockBot);
    expect(mockCtx.reply).toHaveBeenCalledWith(expect.stringContaining('<b>🤖 Bot Commands</b>'), {
      reply_parameters: { message_id: mockCtx.message.message_id },
      parse_mode: 'HTML',
    });
  });

  it('should respond with "Try /help" for the /start command', async () => {
    startCommand(mockBot);
    expect(mockCtx.reply).toHaveBeenCalledWith('Try /help', {
      reply_parameters: { message_id: mockCtx.message.message_id },
    });
  });
});
