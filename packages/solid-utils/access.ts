import { createMemo, type Setter, type Signal } from 'solid-js';
import { type SetStoreFunction, type Store } from 'solid-js/store';

export const get: {
  <T>(signal: Signal<T>): T;
  <T>(signal?: undefined): undefined;
  <T>(signal?: Signal<T>): T | undefined;
} = <T>(signal?: Signal<T>) => signal?.[0]?.();

export const set: {
  <U>(signal: Signal<U>, value?: Exclude<U, Function> | ((prev: U) => U)): U;
  <U, T = Exclude<U, undefined>>(signal?: Signal<U>, ...args: undefined extends T ? [] : [value: (prev: T) => U]): undefined extends T
    ? undefined
    : U;
  <U>(signal: Signal<U>, value: Exclude<U, Function>): U;
  <U>(signal: Signal<U>, value: (prev: U) => U): U;
} = <T>(signal?: Signal<T>, value?: Parameters<Setter<T>>[0]): T => signal?.[1]?.(value as any);

export const mapped: {
  <T>(signal: Signal<T>, map: {
    get: (value: T) => T
    set: (value: T) => T
  }): Signal<T>;
  <T, R>(signal: Signal<R>, map: {
    set: (value: T) => R,
    get: (value: R) => T
  }): Signal<T>;
  <T>(signal: Signal<T>, map: {
    get: (value: T) => T
  }): Signal<T>;
} = <T, R>(signal: Signal<R>, map: {
  set?: (value: T) => R,
  get: (value: R) => T
}): Signal<T> => [
  createMemo(() => map.get(signal[0]())),
  (map.set
    ? val => {
      let result: T;

      signal[1](old => map.set!(
        result = typeof val === 'function'
          ? (val as any)(map.get(old))
          : val as any
      ));

      return result!;
    }
    : val => signal[1](old => (
      typeof val === 'function'
      ? (val as any)(map.get(old))
      : val as any
    ))
  ) as Setter<T>
] as const;

type StoreSignal<T> = [get: Store<T>, set: SetStoreFunction<T>];

export function toSignal<T extends object, K extends keyof T>(
  store: StoreSignal<T>,
  key: K
): Signal<T[K]> {
  return [
    () => store[0][key],
    (v => {
      store[1](old => ({
        ...old,
        [key]: typeof v === 'function'
          ? (v as ((x: T[K]) => T[K]))(old[key])
          : v,
      }));

      return v;
    }) as Setter<T[K]>
  ]
}