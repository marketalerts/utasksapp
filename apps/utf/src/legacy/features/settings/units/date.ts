import { memoize } from 'shared/memoize';

import { getCurrentTimezoneOffset } from 'f/settings/timezone';

export const toMinutes = (d: Date) => Math.floor((d.getTime() / 1000) / 60);

const datesToMemKey = (d?: Date | null, r?: Date): `${number | undefined}:${number | undefined}:${number}` => (
  `${d?.getTime()}:${r?.getTime()}:${getCurrentTimezoneOffset()}`
);

type WithCallbackVariable<F extends (...args: any) => any> = F & {
  <T>(...args: [...args: Parameters<F>, f: (arg: ReturnType<F>) => NonNullable<T>]): NonNullable<T>;
};

export const withCallbackVariable = <F extends (...args: any) => any>(f: F) => (
  (...args: [...args: Parameters<F>, df: (arg: ReturnType<F>) => unknown]) => {
    const df = args[args.length - 1];

    const result = f(...args);

    if (typeof df !== 'function' || f.length >= args.length) {
      return result;
    }

    return df?.(result) ?? result;
  }
) as WithCallbackVariable<F>;


/**
 * Sets "date" to mean "the date in a configured timezone" but in UTC, to trick js
 *
 * Has no change in time if local timezone is the same as in the config
 *
 * (if ```d.getTimezoneOffset() - getCurrentTimezoneOffset() === 0```)
 * @see {@link fromConfigTimezone} for more
 */
export const withConfigTimezone = withCallbackVariable((d: Date) => {
  const date = new Date(d);
  date.setMinutes(date.getMinutes() + date.getTimezoneOffset() - getCurrentTimezoneOffset(d));
  return date;
});

/**
 * Reverts the change made by `withConfigtimezone`
 *
 * Has no change in time if local timezone is the same as in the config
 *
 * (if ```d.getTimezoneOffset() - getCurrentTimezoneOffset() === 0```)
 * @see {@link withConfigTimezone} for more
 */
export const fromConfigTimezone = withCallbackVariable((d: Date) => {
  const date = new Date(d);
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset() + getCurrentTimezoneOffset(d));
  return date;
});

export const withTime = withCallbackVariable((d: Date, hours: number = d.getHours(), minutes: number = d.getMinutes()) => {
  const date = new Date(d);
  date?.setHours(hours, minutes, 1, 1);
  return date;
});

export const withoutTime = withCallbackVariable((d: Date) => {
  const date = new Date(d);
  // "No time" means 00:00:0s:0ms
  date?.setHours(0, 0, 0, 0);
  return date;
});

export const isDateInPast = (d?: Date | null, relativeTo: Date = today()) => !!d && (
  hasTime(d)
    ? d.getTime() < relativeTo.getTime()
    : d.getFullYear() == relativeTo.getFullYear()
      ? d.getMonth() == relativeTo.getMonth()
        ? d.getDate() < relativeTo.getDate()
        : d.getMonth() < relativeTo.getMonth()
      : d.getFullYear() < relativeTo.getFullYear()
);

export const isDateEqual = (d?: Date | null, relativeTo: Date = today()) => !!d && (
  withoutTime(d, d => withoutTime(relativeTo, relativeTo =>
    d.getFullYear() == relativeTo.getFullYear()
    && d.getMonth() == relativeTo.getMonth()
    && d.getDate() == relativeTo.getDate(),
  ))
);

export const today = () => withoutTime(new Date());

export const relativeDate = (deltaDays: number) => (relativeTo = today()) => {
  const date = new Date(relativeTo);
  date.setDate(relativeTo.getDate() + deltaDays);
  return date;
};

export const yesterday = relativeDate(-1);
export const tomorrow = relativeDate(1);
export const afterTomorrow = relativeDate(2);

/**
 * Checks if a date "has no time",
 * i.e. has 0s:0ms and should be taken as a literal day,
 * without the time at all
 */
export const hasNoTime = (date?: Date | null) => !!date && (
  date.getSeconds() === 0 &&
  date?.getMilliseconds() === 0
);
/**
 * Checks if a date was set to mean a specific time,
 * i.e. has at least a second or a millisecond in it
 */
export const hasTime = (date?: Date | null) => !!date && (
  date.getSeconds() !== 0 ||
  date?.getMilliseconds() !== 0
);

export const toRelativeTimeString = (date: Date | null) => {
  return date?.toISOString() ?? null;
};

/**
 * Convert a date's timezone back to normal,
 * due to client-only reliance on local timezone.
 *
 * i.e. dates in config timzeone now pretend they are in a local timezone
 *
 * Dates "without a time" (see hasNoTime for more info)
 * should be shifted back from a pseudo-local timezone (with setting timezone offset)
 * to proper local timezone in order to be parsed correctly later.
 */
export const normalizeDate = (clientDate?: Date | null): Date | null => {
  if (!clientDate) {
    return clientDate ?? null;
  }

  const serverDate = fromConfigTimezone(new Date(clientDate));

  if (hasNoTime(clientDate)) {
    // Clear time
    serverDate.setUTCHours(0, 0, 0, 0);
  } else {
    // Otherwise, make sure the date is marked as having time
    serverDate.setUTCSeconds(1, 1);
  }

  return serverDate;
};

/**
 * Convert a date's timezone in a way
 * to account for client-only reliance on local timezone,
 * and dates "without time" (0h:0m:0s:0ms)
 *
 * i.e. dates in local timzeone now pretend they are in a config timezone
 *
 * Dates "without a time" (see hasNoTime for more info)
 * should be shifted to a pseudo-local timezone (with setting timezone offset)
 * from a local timezone in order to be displayed correctly later.
 */
export const denormalizeDate = (serverDate?: Date | null): Date | null => {
  if (!serverDate) {
    return serverDate ?? null;
  }

  const clientDate = withConfigTimezone(new Date(serverDate));

  if (hasNoTime(serverDate)) {
    // Clear time
    clientDate.setHours(0, 0, 0, 0);
  } else {
    // Otherwise, make sure the date is marked as having time
    clientDate.setUTCSeconds(1, 1);
  }

  return clientDate;
};
