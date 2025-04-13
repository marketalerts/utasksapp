import { createSignal } from 'solid-js';
import { makePersisted } from '@solid-primitives/storage';

import { currentLocale } from 'shared/l10n';

import { ClientOnlyDynamicSetting } from 'f/dynamic-settings/adapter';
import type { SupportedSettings } from 'f/dynamic-settings/adapter';

import { CloudStorage } from 'shared/ui/telegram';

export type HourCycle = Intl.DateTimeFormatOptions['hourCycle'] | undefined;

export const [getCurrentHourCycle, setCurrentHourCycle] = makePersisted(
  createSignal<Intl.DateTimeFormatOptions['hourCycle']>(),
  {
    name: 'hour-cycle',
    storage: CloudStorage,
  },
);

export const hourCycles: Array<HourCycle> = [
  undefined,
  'h11',
  'h12',
  'h23',
  'h24',
];

export const getDefaultHourCycle = (): HourCycle => {
  const locale = currentLocale();

  // @ts-expect-error non-standard property
  return Array.isArray(locale.hourCycles) && locale.hourCycles[0] ? locale.hourCycles[0]
    // @ts-expect-error non-standard property
    : typeof locale.getHourCycles === 'function' ? locale.getHourCycles()
    : locale.hourCycle;
};

const prefix = 'CLIENT_TIMECYCLE_';
const cyclesEntries = hourCycles.map(c => getHourCycleKey(c));

function getHourCycleKey(c: string | undefined): string {
  return prefix + String(c).toUpperCase();
}

function getHourCycleValue(v: string | undefined) {
  const cycle = v?.replace(prefix, '').toLowerCase() as HourCycle | 'undefined';

  return cycle === 'undefined' ? undefined : cycle;
}

export const hourCycleSetting = new ClientOnlyDynamicSetting<SupportedSettings.Options>({
  code: 'CLIENT_TIMECYCLE_OPTIONS',
  get defaultValue() {
    try {
      return getHourCycleKey(getDefaultHourCycle());
    } catch {
      return getHourCycleKey(undefined);
    }
  },
  enabled: true,

  // @ts-expect-error Maybe support will come later
  options: cyclesEntries,
}, {
  getValue() {
    const cycle = getCurrentHourCycle();
    return cycle ? getHourCycleKey(cycle) : null;
  },
  setValue(v) {
    setCurrentHourCycle(getHourCycleValue(v));
  },
  hint: () => getHourCycleKey(getDefaultHourCycle()),
  isPro: false,
});