import { createSignal } from 'solid-js';
import { makePersisted } from '@solid-primitives/storage';

import { ClientOnlyDynamicSetting } from 'f/dynamic-settings/adapter';
import type { SupportedSettings } from 'f/dynamic-settings/adapter';

import { safeRead } from './cached';

import { CloudStorage } from 'shared/ui/telegram';

export const [getCurrentProjectGear, setCurrentProjectGear] = makePersisted(
  createSignal(safeRead('project-gear', false)),
  {
    name: 'project-gear',
    storage: CloudStorage,
  },
);

export const projectGearSetting = new ClientOnlyDynamicSetting<SupportedSettings.Toggle>({
  code: 'CLIENT_GEAR_TOGGLE',
  defaultValue: false,
  enabled: true,
}, {
  isPro: true,
  getValue() {
    return getCurrentProjectGear();
  },
  setValue(v) {
    setCurrentProjectGear(v);
  },
});