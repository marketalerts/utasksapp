import { createMemo, createSignal, onMount } from 'solid-js';
import type { Signal } from 'solid-js';
import { isEqual } from './rules';
import { createArray } from '../utils';

export function useIntersectionDateSetter(
  [date, setDate]: Signal<Date>,
  root: () => HTMLDivElement | undefined,
  detectionMargin: () => number,
  callback?: (newDate: Date) => void | Date,
  intersectionDates: [min: number, max: number] = [8, 22]) {
  const [dateObserver, setObserver] = createSignal<IntersectionObserver>();
  const datePositionCache = new Map<Date, [x: number, y: number]>();

  const [rememberPosition, reevaluateElementPositions] = createSignal<void>(undefined, {
    equals: () => false,
  });

  onMount(() => {
    // TODO: better month intersection detection mechanism?
    // instead of detecting individual date cells we could simply count weeks instead
    setObserver(new IntersectionObserver(elements => requestAnimationFrame(() => {
      const el = elements.find(el => el.isIntersecting);

      if (!el) {
        return;
      }

      const newDate = decodeDateFromAttrs(el.target as HTMLElement, true);

      if (!newDate) {
        return;
      }

      if (isEqual(newDate, date())) return;

      setDate(callback?.(newDate) ?? newDate);
    }), {
      get root() { return root(); },
      threshold: 0,
      rootMargin: `-${detectionMargin()}px 0px -${detectionMargin()}px 0px`,
    }));
  });

  function shouldObserve(date: Date) {
    const [min, max] = intersectionDates;
    const _date = date.getDate();
    return min <= _date && _date <= max;
  }

  return {
    dateObserver,
    shouldObserve,
    refreshObserve(el: Element, date?: Date | null) {
      dateObserver()?.unobserve(el);

      if (date && shouldObserve(date)) {
        dateObserver()?.observe(el);
      }
    },
    decodeDateFromAttrs,
    getDateCellElement,

    reevaluateElementPositions,

    getDateElementPosition(date?: Date | null): [x: number, y: number] {
      rememberPosition();

      if (!date) return [0, 0];

      const cached = datePositionCache.get(date);

      if (cached && cached[1] !== 0) {
        return cached;
      }

      const el = getDateCellElement(date, true);

      if (!el || !el.parentElement)
        return cached ?? [0, 0];

      const x = el.offsetLeft;
      const y = el.offsetTop;

      datePositionCache.set(date, [x, y]);

      return [x, y];
    },
  };

  function decodeDateFromAttrs(el: HTMLElement, monthOnly = true) {
    const newDay = Number(el.dataset.date);
    const newMonth = Number(el.dataset.month);
    const newYear = Number(el.dataset.year);

    if ([newDay, newMonth, newYear].some(isNaN)) {
      return undefined;
    }

    return new Date(newYear, newMonth, monthOnly ? 1 : newDay);
  }

  function queryDomDate(date: Date, monthOnly = true) {
    const monthQuery = `[data-month="${date.getMonth()}"][data-year="${date.getFullYear()}"]`;
    const dayQuery = `[data-date="${date.getDate()}"]`;

    return monthOnly ? monthQuery : (monthQuery + dayQuery);
  }

  function getDateCellElement(date: Date, exact = false) {
    return (root()?.querySelector(queryDomDate(date, !exact))) as HTMLElement | null;
  }
}

export interface CellAttrs {
  'data-date': number;
  'data-month': number;
  'data-year': number;
}

export function useVirtualOffset(renderOrigin: () => number, rowElementHeight: () => number, overscan = 26) {
  const initialOrigin = renderOrigin();
  const offsets = createMemo(() => (
    interpolateWithOffset(initialOrigin, () => renderOrigin() - overscan, 1 + overscan * 2)
  ));

  const { topMargin, bottomMargin } = useVirtualList(renderOrigin, rowElementHeight, overscan);

  return { topMargin, offsets, bottomMargin };
}

export function useVirtualList(renderOrigin: () => number, rowElementHeight: () => number, overscan: number) {
  const minRenderOrigin = createMemo<number>(
    (lastRenderOrigin) => (
      Math.min(renderOrigin(), lastRenderOrigin)
    ),
    0,
  );

  const maxRenderOrigin = createMemo<number>(
    (lastRenderOrigin) => (
      Math.max(renderOrigin(), lastRenderOrigin)
    ),
    renderOrigin(),
  );

  const topMargin = createMemo(() => (renderOrigin() - minRenderOrigin() - overscan) * rowElementHeight());
  const bottomMargin = createMemo(() => (maxRenderOrigin() - renderOrigin()) * rowElementHeight());

  return { topMargin, bottomMargin };
}

export function interpolateWithOffset(origin: number, offset: () => number, length = 52) {
  return createArray(length, i => i + offset() - origin);
}