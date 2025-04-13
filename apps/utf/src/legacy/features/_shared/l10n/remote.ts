import { merge } from 'rambda';
import type { LocaleResponse } from '@intl-schematic/solid';

import { getConfigString, configFetching, firebaseConfig } from 'shared/firebase';

import { currentLocale } from '.';

export const getLocaleUrl = (lang: string, path: string) => () => (
  firebaseConfig.then(config => [config.databaseURL, 'utf/locales', lang, path + '.json'].join('/'))
);

export function fetchRemoteLocale<Locale>(
  getLocal: (fallbackLocale: Intl.Locale) => Promise<LocaleResponse<Locale>>,
  getFallback: (fallbackLocale: Intl.Locale) => Promise<LocaleResponse<Locale>>,
  locale: Intl.Locale,
  path: string,
): Promise<LocaleResponse<Locale>> {
  return getConfigString('defaultlocale')
    .then(locale => locale || 'en')
    .then(fetchLocaleDocuments)
    .catch(() => fetchLocaleDocuments(currentLocale()))
    .then(([localLocaleDoc, fallbackLocaleDoc]) => ({
      default: merge(fallbackLocaleDoc, localLocaleDoc),
      remote: (configFetching
        .then(getLocaleUrl(locale.language, path))
        .then(fetch)
        .then(r => r.json() as Locale | null)
        .then(merge<Locale>(localLocaleDoc)))
        .catch(() => localLocaleDoc),
    }));

  function fetchLocaleDocuments(loc: string | Intl.Locale) {
    const locale = loc instanceof Intl.Locale ? loc : new Intl.Locale(loc);

    return Promise.all([
      getLocal(new Intl.Locale(locale)).then(r => r.default),
      getFallback(new Intl.Locale(locale)).then(r => r.default),
    ]);
  }
}
