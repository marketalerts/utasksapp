import { createMemo, createSignal } from 'solid-js';
import type { Signal } from 'solid-js';
import { createUndoHistory } from '@solid-primitives/history';
import type { UndoHistoryReturn } from '@solid-primitives/history';

import { get, set } from './access';

export type HistorySignal<T> = Signal<T> & UndoHistoryReturn & {
  [HistorySignal]: true;

  readonly original: T;
  clear(): void;
  reset(newDefault?: T, acceptNull?: boolean): void;
  previous(): T;
}

const HistorySignal = Symbol('HistorySignal');

export const isHistorySignal = <T>(v: Signal<T>): v is HistorySignal<T> => HistorySignal in v;

export const createHistorySignal: {
  <T>(value: Exclude<T, Function>): HistorySignal<T>;
  <T>(): HistorySignal<T | undefined>;
} = <T>(value?: Exclude<T, Function>) => {
  const [trackClear, clear] = createSignal(undefined, { equals: false });

  const signal = createSignal(value) as HistorySignal<T>;

  signal.clear = clear;

  let previousValue: T;

  const history = createMemo(() => {
    // track what should rerun the memo
    trackClear();
    return createUndoHistory(() => {
      previousValue = get(signal);
      return () => set(signal, previousValue as Exclude<T, Function>);
    });
  });

  Object.defineProperty(signal, 'original', {
    get: () => value,
  });

  signal.canRedo = () => history()?.canRedo() ?? false;
  signal.canUndo = () => history()?.canUndo() ?? false;
  signal.redo = () => history()?.redo();
  signal.undo = () => history()?.undo();
  signal.previous = () => previousValue;
  signal.reset = (newDefault, acceptNull?: boolean) => {
    if (newDefault != null || acceptNull) {
      signal[1](newDefault as any);
    } else {
      signal[1](value as any);
    }
    signal.clear();
  };

  signal[HistorySignal] = true;

  return signal;
};
