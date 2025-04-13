import { createSignal } from 'solid-js';
import { makePersisted } from '@solid-primitives/storage';

import { ClientOnlyDynamicSetting } from 'f/dynamic-settings/adapter';
import type { SupportedSettings } from 'f/dynamic-settings/adapter';

import { safeRead } from './cached';

import { CloudStorage } from 'shared/ui/telegram';

export const displayNews = makePersisted(createSignal<boolean>(safeRead('news', false)), {
  name: 'news',
  storage: CloudStorage,
});


export const newsSetting = new ClientOnlyDynamicSetting<SupportedSettings.Toggle>({
  code: 'CLIENT_NEWS_TOGGLE',
  defaultValue: true,
  enabled: true,
}, {
  isPro: true,
  getValue() {
    return displayNews[0]();
  },
  setValue(v) {
    displayNews[1](v);
  },
});
