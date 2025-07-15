import { Context as GrammyContext } from 'grammy';
import { CloudflareBindings } from '../../worker-configuration';

declare module 'grammy' {
  interface Context extends GrammyContext {
    env: CloudflareBindings;
  }
}
