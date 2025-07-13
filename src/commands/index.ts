import { Bot } from 'grammy';
import start from './start';
import ping from './ping';
import help from './help';

export default (bot: Bot) => {
  start(bot);
  ping(bot);
  help(bot);
};
