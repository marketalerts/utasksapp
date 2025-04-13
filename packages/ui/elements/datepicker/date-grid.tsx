import type { Accessor, JSX } from 'solid-js';
import { createMemo, For, Index } from 'solid-js';
import { daysPerWeek, getDayOffsetFromWeekOffset, getDisplayDate, getNearestWeekStart } from './rules';
import { createArray } from '../utils';

export function DateGrid(props: {
  origin: Date;
  weekOffsets: readonly number[] | readonly Accessor<number>[];
  weekStartDay: number;
  children: (rowData: DateRowProps) => JSX.Element;
}) {
  const weekStart = createMemo(() => getNearestWeekStart(props.weekStartDay, props.origin));

  return <>
    <For each={props.weekOffsets}>{(offset) => {
      const week = useWeek(offset);

      return <props.children
        week={week.days}
        weekOffset={week.offset}
        containsMonthStart={week.containsMonthStart}
      />;
    }}</For>
  </>;

  function useWeek(offset: Accessor<number> | number) {
    const week = createMemo(() => createWeek(typeof offset === 'number' ? () => offset : offset));

    return {
      get days() {
        return week();
      },
      get offset() {
        return typeof offset === 'number' ? offset : offset();
      },
      containsMonthStart: createMonthStartCheck(week),
    };
  }

  function createWeek(offset: Accessor<number>): Accessor<Date>[] {
    return createArray(
      daysPerWeek,
      d => () => getDisplayDate(getDayOffsetFromWeekOffset(d, offset()), weekStart()),
    );
  }

  function createMonthStartCheck(week: Accessor<Accessor<Date>[]>) {
    return createMemo(() => {
      return week().some(d => d().getDate() === 1);
    });
  }
}

export interface DateRowProps {
  weekOffset: number;
  containsMonthStart: Accessor<boolean>;
  week: Accessor<Date>[]
}

export function DateRow(props: DateRowProps & {
  children: (date: Date, index: Accessor<number>) => JSX.Element;
}) {
  return <For each={props.week}>{(day, index) => props.children(getDisplayProxy(day), index)}</For>;
}

function getDisplayProxy<T extends Record<string | symbol, any>>(date: Accessor<T>): T {
  return new Proxy({} as T, {
    get(_, key) {
      const target = date();
      const val = target[key];

      return typeof val === 'function' ? val.bind(target) : val;
    },
  });
};
