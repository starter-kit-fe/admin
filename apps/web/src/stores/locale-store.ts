'use client';

import type { AppLocale } from '@/i18n/routing';
import { routing } from '@/i18n/routing';
import { LOCALE_PREFERENCE_KEY } from '@/i18n/preferences';
import { atom, useAtomValue, useSetAtom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

const localePreferenceAtom = atomWithStorage<AppLocale>(
  LOCALE_PREFERENCE_KEY,
  routing.defaultLocale as AppLocale,
  undefined,
  { getOnInit: false },
);

const setLocalePreferenceAtom = atom(
  null,
  (_get, set, nextLocale: AppLocale) => {
    set(localePreferenceAtom, nextLocale);
  },
);

export function useLocaleStore() {
  const locale = useAtomValue(localePreferenceAtom);
  const setLocalePreference = useSetAtom(setLocalePreferenceAtom);

  return {
    locale,
    setLocalePreference,
  };
}
