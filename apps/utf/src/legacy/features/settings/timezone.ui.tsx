import WebApp from 'tma-dev-sdk';
import { model, useDirectives } from 'solid-utils/model';
import { get } from 'solid-utils/access';
import { Dynamic } from 'solid-js/web';
import { Show, createEffect, createMemo, createSelector, createSignal, on } from 'solid-js';
import type { JSX, ParentProps } from 'solid-js';

import { currentLocale } from 'shared/l10n';

import { defaultTimeZone, timeZoneIds } from './timezone-list';
import { getLocalTimezone, getLocalTimezoneId, getLocaleTimeZones, getTimezone, getTimezoneOffset } from './timezone';
import type { ClientTimeZone } from './settings.adapter';

import { t } from 'locales/settings';

import List from 'shared/ui/list';

import SearchOutlined from 'icons/SearchOutlined.svg';
import Checkmark from 'icons/Checkmark.svg';

export default function TimeZonesList(props: {
  selectTimeZone: (timeZone: ClientTimeZone) => () => unknown;
  getSelectedTimeZone: () => ClientTimeZone;
  wrapper?: (props: ParentProps) => JSX.Element;
  hideLocal?: boolean;
}) {
  useDirectives(model);

  const getWrapper = createMemo(() => props.wrapper ?? ((props: ParentProps) => <main class="= p-4 pt-15">{props.children}</main>));

  const isSelected = createSelector(() => props.getSelectedTimeZone().id);

  const timeZoneFilter = createSignal('');
  const hasFilter = (str: string) => (
    get(timeZoneFilter).toLowerCase().split(' ').some(f => str.toLowerCase().replace('_', ' ').includes(f))
  );

  const localeTimeZones = createMemo(() => getLocaleTimeZones(currentLocale()));
  const getSortedTimeZones = createMemo(calculateSortedTimeZones);

  const list = createMemo(() => (
    get(timeZoneFilter).length > 2
      ? getSortedTimeZones()
          .filter(tz => (
            hasFilter(t('setting timezone name', { value: tz.id, default: tz.id }))
            || Object.values(tz)
              .map(String)
              .some(hasFilter)
          ))
      : getSortedTimeZones()
  ));

  createEffect(() => {
    props.getSelectedTimeZone();
    setTimeout(() => (
      document.getElementById(props.getSelectedTimeZone().id)
        ?.scrollIntoView({ block: 'center', behavior: 'smooth' })
    ));
  });

  createEffect(on(() => props.getSelectedTimeZone().id, () => {
    WebApp.HapticFeedback.selectionChanged();
  }, { defer: true }));

  return <>
    <Dynamic component={getWrapper()}>
      <div class="= fixed top-0 ltr:left-0 rtl:right-0 ltr:right-0 rtl:left-0 bg-tg_bg_secondary z-10 flex px-4 py-2 items-center">
        <div class="= h-9 bg-tg_bg_tertiary flex-grow flex items-center rounded-3 ltr:pl-3 rtl:pr-3 ltr:pr-4 rtl:pl-4 gap-2">
          <SearchOutlined class="= fill-tg_hint" />
          <input type="search"
            class="=timezone-search h-full p-0 flex-grow"
            placeholder={t('setting timezone search placeholder')}
            use:model={timeZoneFilter}
          />
        </div>
      </div>
      <List each={list()}>
        {(timeZone) =>
          <List.Item onClick={props.selectTimeZone(timeZone)}
            id={timeZone.id}
            rightHint={
              timeZone.id === defaultTimeZone
                ? getLocalTimezone().offsetName
                : timeZone.offsetName
            }
            right={
              <Checkmark class="= fill-tg_button app-transition-width,opacity"
                classList={{ 'w-0 opacity-0': !isSelected(timeZone.id) }}
              />
            }
          >
            <TimezoneRow timeZone={timeZone}/>
          </List.Item>
        }
      </List>
    </Dynamic>
  </>;

  function TimezoneRow(_props: { timeZone: ClientTimeZone; }) {
    const localName = createMemo(
      () => t('setting timezone name', { value: getLocalTimezoneId() }).split('/').map(r => r.trim())[1],
    );

    const timeZone = createMemo(() => {
      const [area, name] = t('setting timezone name', { value: _props.timeZone.id }).split('/').map(r => r.trim());

      return {
        id: _props.timeZone.id,
        area,
        name,
      };
    });

    return <p class="=timezone-name m-0 c-tg_hint whitespace-nowrap overflow-hidden inline-flex">
      <span class="= overflow-hidden text-ellipsis whitespace-nowrap">
        {timeZone().area}&nbsp;<Show when={(timeZone().name || _props.timeZone.id === defaultTimeZone) && !!(timeZone().name ?? localName())}>
          /&nbsp;
        </Show>
      </span>
      <Show when={timeZone().name || _props.timeZone.id === defaultTimeZone}>
        <span class="= c-tg_text overflow-initial ltr:mr-1 rtl:ml-1">{timeZone().name ?? localName()}</span>
      </Show>
    </p>;
  }

  function calculateSortedTimeZones() {
    const priorityZones = localeTimeZones();

    return (props.hideLocal ? timeZoneIds : [defaultTimeZone].concat(timeZoneIds))
      .map(tz => getTimezone(getTimezoneOffset(tz), tz))
      .sort((a, b) => {
        if (b.id === defaultTimeZone)
          return 100;

        const bIndex = priorityZones?.indexOf(b.id) ?? -1;
        const aIndex = priorityZones?.indexOf(a.id) ?? -1;

        if (bIndex < 0 && aIndex < 0)
          return b.offset - a.offset;

        return bIndex - aIndex;
      });
  }
}

export function getTimezoneName(timeZone: ClientTimeZone) {
  const [area, name] = t('setting timezone name', { value: timeZone.id }).split('/').map(x => x.trim());

  return { area, name: name || area, offsetName: timeZone.offsetName };
}
