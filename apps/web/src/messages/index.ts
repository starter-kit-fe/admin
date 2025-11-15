import en from './en';
import zhHans from './zh-Hans';

export const messages = {
  en,
  'zh-Hans': zhHans,
} as const;

export type Messages = typeof messages.en;

export default messages;
