import WebApp from 'tma-dev-sdk';
import { get, set } from 'solid-utils/access';
import { createSignal } from 'solid-js';
import { makePersisted } from '@solid-primitives/storage';

import { CloudStorage } from 'shared/ui/telegram';

const localeKey = 'locale';

// CloudStorage backs up to LocalStorage,
// so we can safely assume user locale is stored there most of the times
// P.S. this variable should never be used outside of this module,
// because `currentLocale` is more descriptive and better represents the selected language
const clientLocale = localStorage.getItem(localeKey)
  || WebApp.initDataUnsafe.user?.language_code
  || window.navigator.language;

const locale = makePersisted(createSignal(
  new Intl.Locale(clientLocale),
  { equals: (prev, next) => prev.baseName == next.baseName },
), {
  name: localeKey,
  storage: CloudStorage,
  serialize(data) {
    return data.baseName;
  },
  deserialize(data) {
    try {
      return new Intl.Locale(data);
    } catch {
      return new Intl.Locale(clientLocale);
    }
  },
});

/**
 * Accessor for a current browser language
 */
export const currentLocale = () => get(locale);

export const setCurrentLocale = (value: string | Intl.Locale) => set(locale, new Intl.Locale(value));
