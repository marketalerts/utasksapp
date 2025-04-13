import { get, set } from 'solid-utils/access';
import { createSignal } from 'solid-js';
import { defaultProcessors } from '@intl-schematic/plugin-defaults';

import { defaultTimeZone, timeZoneIds } from './timezone-list';
import type { ClientTimeZone } from './settings.adapter';

const currentTimeZone = createSignal<ClientTimeZone>(getTimezone());

// get processor for universal locale (Interlingua - "ia")
const DateProcessor = defaultProcessors.date(new Intl.Locale('ia'));

export const getCurrentTimezone = () => {
  return get(currentTimeZone);
};

export const getCurrentTimezoneId = () => (
  get(currentTimeZone).id === defaultTimeZone ? getLocalTimezoneId() : get(currentTimeZone).id
);

export const setCurrentTimezone = (value: ClientTimeZone) => {
  set(currentTimeZone, value);
  return value;
};

export function getLocalTimezoneOffset(dateSource = new Date()) { return dateSource.getTimezoneOffset(); }
export const getCurrentTimezoneOffset = (dateSource?: Date) => {
  const timeZone = get(currentTimeZone);

  if (!timeZone || timeZone.id === defaultTimeZone) {
    return getLocalTimezoneOffset(dateSource);
  }

  return dateSource ? getRawTimezoneOffset(timeZone.id, dateSource) : timeZone.offset;
};

export function getTimezoneOffset(offsetId?: string) {
  if (!offsetId) {
    return 0;
  }

  if (offsetId === defaultTimeZone) {
    return getLocalTimezoneOffset();
  }

  return getRawTimezoneOffset(offsetId);
}

function getRawTimezoneOffset(offsetId: string, origin = new Date()) {
  try {
    const [hours, minutes] = (
      getTZNameFromOptions('longOffset', offsetId, origin)?.slice(3) ?? '0:0'
    ).split(':').map(Number);

    if (isNaN(hours) || isNaN(minutes)) {
      throw 'invalid timezone value';
    }

    return (-hours * 60) + (minutes ? (hours < 0 ? minutes : -minutes) : 0);
  } catch (error) {
    // Safari can't parse the international `ia` format, so US english is used here
    const localizedTime = new Date(origin.toLocaleString('en', { timeZone: offsetId }));
    const utcTime = new Date(origin.toLocaleString('en', { timeZone: 'UTC' }));

    return -Math.round((localizedTime.getTime() - utcTime.getTime()) / (60 * 1000));
  }
}

export function getTimezone(): ClientTimeZone;
export function getTimezone(timeZoneOffset: number, index?: number): ClientTimeZone;
export function getTimezone(timeZoneOffset: number, timeZoneId: string): ClientTimeZone;
export function getTimezone(timeZoneOffset?: number, timeZoneId?: string | number): ClientTimeZone {
  if (typeof timeZoneOffset === 'undefined') {
    return getTimezone(
      getLocalTimezoneOffset(),
      defaultTimeZone,
    );
  }

  if (typeof timeZoneId === 'string') {
    timeZoneOffset = getTimezoneOffset(timeZoneId);
  }

  const timeZone = typeof timeZoneId === 'string' ? timeZoneId : typeof timeZoneId === 'number'
    ? timeZoneIds[timeZoneId]
    : getTimeZoneId(timeZoneOffset);

  if (!timeZone) {
    return getTimezone();
  }

  const offsetHours = Math.floor(Math.abs(timeZoneOffset) / 60);
  const offsetName = (timeZoneOffset <= 0 ? '+' : '-') + [
    offsetHours,
    ('00' + (timeZoneOffset % 60)).slice(-2),
  ].join(':');

  return {
    id: timeZone,
    offset: timeZoneOffset,
    offsetName,
  };
}

export function getLocalTimezoneId(): string {
  return new Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export const getLocalTimezone = () => getTimezone();

export function getTimeZoneId(timeZoneOffset?: number) {
  return timeZoneIds.find(tz => getTimezoneOffset(tz) === timeZoneOffset);
}

export function getTZNameFromOptions(
  timeZoneName: Intl.DateTimeFormatOptions['timeZoneName'],
  timeZone: string = Intl.DateTimeFormat().resolvedOptions().timeZone,
  origin?: Date,
  locale?: Intl.Locale,
) {
  // It's guaranteed to be found
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return (locale ? defaultProcessors.date(locale) : DateProcessor)({ timeZoneName, timeZone }, timeZone + timeZoneName)
    .toParts(origin)
    .find(p => p.type === 'timeZoneName')!.value;
}

export function getLocaleTimeZones(locale: Intl.Locale): string[] {
  // @ts-expect-error non-standard property
  return Array.isArray(locale.timeZones) ? locale.timeZones
    // @ts-expect-error non-standard property
    : typeof locale.getTimeZones === 'function' ? locale.getTimeZones() ?? []
    : [];
}
