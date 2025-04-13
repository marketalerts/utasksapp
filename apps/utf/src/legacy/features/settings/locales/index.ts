import { createRoot } from 'solid-js';

import { fetchRemoteLocale } from 'shared/l10n/remote';
import { createLocaleResource } from 'shared/l10n';

const getDefault = (defaultLocale: Intl.Locale): Promise<any> => (
  import(`../locales/${defaultLocale.language}.json`)
);

export const t = createRoot(() => createLocaleResource<typeof import('./en.json')>(locale => (
  fetchRemoteLocale(
    defaultLocale => import(`../locales/${locale.language}.json`)
      .catch(() => getDefault(defaultLocale)),
    getDefault,
    locale,
    'settings',
  )
)));
