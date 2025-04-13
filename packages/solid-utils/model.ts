import { createEffect, createRenderEffect, onMount } from 'solid-js';
import type { Signal } from 'solid-js';
import type { DragOptions } from 'neodrag/packages/solid';

import { get, set } from './access';

type InputModelTypes = string | number | boolean;
declare module 'solid-js' {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    type Model<T> = [() => T, (v: T) => T];

    interface Directives {
      model: Model<InputModelTypes>;
      datemodel: Model<Date | null>;
      draggable: DragOptions;
    }
  }
}

export function model<T extends InputModelTypes>(
  el: HTMLElement & { value: T; },
  value: () => Signal<T>
) {
  onMount(() => {
    const [field, setField] = value();

    const input = el as any as HTMLInputElement;

    if ('type' in input && 'checked' in input && ['checkbox', 'radio'].includes(input.type)) {
      createEffect(() => input.checked = !!field());

      input.addEventListener('change', () => {
        input.checked = setField(!!input.checked as any);
      });
    } else {
      createEffect(() => {
        el.value = field();
      });
      el.addEventListener('input', () => el.value = setField(el.value as any));
    }
  });
}

const invalidDateStringPart = ':00.000Z';
const dateToInputFormat = (date: Date | null) => (
  date && date.toString() != 'Invalid Date'
    ? new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        0,
        0,
        0,
        0
      )?.toISOString().slice(0, -invalidDateStringPart.length)
    : ''
);

export const datemodel = (today: Date) => (
  el: HTMLInputElement,
  value: () => Signal<Date | null>
) => {
  const field = value();

  createRenderEffect(() => {
    el.value = dateToInputFormat(get(field));
  });
  el.addEventListener('input', () => {
    if (!el.value) {
      set(field, null);

      return;
    }

    const [
      year,
      month,
      date,
      hour = 0,
      minute = 0,
    ] = el.value.split(/[-T:]/g).filter(x => !!x).map(x => parseInt(x, 10)) ?? [
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      0,
      0,
    ];

    set(field, new Date(year, month - 1, date, hour, minute));
  });
}

export const useDirectives = (...directives: any[]) => { directives; };
