import { createMemo, createRoot } from 'solid-js';
import type { JSX } from 'solid-js';
import { createLocaleResource as CLR } from '@intl-schematic/solid';
import { defaultPlugins, cachedIntl, defaultProcessors, dictionary } from '@intl-schematic/plugin-defaults';

import { isDateEqual, today as _today, tomorrow as _tomorrow, yesterday as _yesterday, relativeDate, hasTime, hasNoTime, afterTomorrow as _afterTomorrow } from 'f/settings/units/date';
import { getLocalTimezoneId, getTimeZoneId } from 'f/settings/timezone';
import { getCurrentHourCycle } from 'f/dynamic-settings/profile-settings/client-only';

import { currentLocale } from './current';
export { currentLocale, setCurrentLocale } from './current';

export const currentTextDirection = createRoot(() => createMemo(() => {
  const langName = new Intl.DisplayNames(currentLocale(), { type: 'language' }).of(currentLocale().language);
  const div = document.createElement('div');

  div.setAttribute('dir', 'auto');
  div.innerText = langName ?? '';
  div.style.display = 'none';
  document.body.appendChild(div);

  const direction = getComputedStyle(div).direction as JSX.HTMLDir;

  document.body.removeChild(div);

  return direction;
}));

const convertDateString = (dateStr: string) => new Date(dateStr);

const addSettings = (options?: Intl.DateTimeFormatOptions, timezoneOverride?: string) => ({
  ...options,
  timeZone: timezoneOverride,
  hourCycle: getCurrentHourCycle(),
});

const formatWithTimeZone = (
  format: (value: string | Date, optionsOverride?: Intl.DateTimeFormatOptions) => string,
  convert: (date: string) => Date,
) => (...args: Parameters<typeof format>) => {
  const [input, optionsOverride] = args;
  const date = typeof input === 'string' ? convert(input) : input;

  return format(input, addSettings(optionsOverride, hasNoTime(date) ? 'UTC' : undefined));
};

const date = cachedIntl(
  Intl.DateTimeFormat,
  convertDateString,
  { format: formatWithTimeZone },
);

export const createLocaleResource = CLR(currentLocale, (locale) => defaultPlugins(locale, {
  ...defaultProcessors,

  dictionary,

  date,

  'intl/date': date,

  'relative-date': cachedIntl(
    Intl.DateTimeFormat,
    convertDateString,
    {
      // TODO: consider memoization
      format: format => (input: {
        today?: string;
        tomorrow?: string;
        afterTomorrow?: string;
        yesterday?: string;
        template?: string
        date?: string | Date | null;
      } & {
        [delta: number]: string;
      }, optionsOverride?: Intl.DateTimeFormatOptions) => {
        const date = new Date(input.date ?? new Date());
        const today = _today();

        const options = addSettings({
          ...optionsOverride,
          year: (date.getFullYear() !== today.getFullYear())
            ? 'numeric'
            : optionsOverride?.year,
        }, getTimeZoneId(date.getTimezoneOffset()));

        const tomorrow = _tomorrow();
        const yesterday = _yesterday();
        const afterTomorrow = _afterTomorrow();

        const customDeltas = Object.keys(input)
          .map(Number)
          .filter(x => !isNaN(x))
          .map(x => ({ delta: x, date: relativeDate(x)(today) }));

        const getDelta = () => {
          const delta = customDeltas.find(value => isDateEqual(date, value.date))?.delta;

          return delta && delta in input ? input[delta] : undefined;
        };

        const shouldAddTime = (
          (isDateEqual(date, today) && input.today) ||
          (isDateEqual(date, tomorrow) && input.tomorrow) ||
          (isDateEqual(date, yesterday) && input.yesterday) ||
          (isDateEqual(date, afterTomorrow) && input.afterTomorrow) ||
          getDelta()
        ) && hasTime(date);

        const result = format((
            isDateEqual(date, today) ? input.today
          : isDateEqual(date, tomorrow) ? input.tomorrow
          : isDateEqual(date, yesterday) ? input.yesterday
          : isDateEqual(date, afterTomorrow) ? input.afterTomorrow
          : getDelta()
        ) ?? input.date ?? date, options);

        if (shouldAddTime) {
          return `${result}, ${format(date, {
            ...options,
            hour: '2-digit',
            minute: '2-digit',
            day: undefined,
            month: undefined,
            year: undefined,
          })}`;
        }

        return result;
      },
    },
  ),

  'relative-time': lang => (options: Intl.RelativeTimeFormatOptions & { unit: Intl.RelativeTimeFormatUnit, skip?: string[]; }) => {
    const relativeTimeFormat = new Intl.RelativeTimeFormat(lang.baseName, options);

    return (input: Date) => {
      const delta: number = Math.floor((input.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      const result = relativeTimeFormat.format(delta, options.unit);

      if (options.skip) {
        return options.skip.reduce((r, sk) => r.replace(sk, ''), result);
      }

      return result;
    };
  },
}));
