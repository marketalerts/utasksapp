import { children, ChildrenReturn, createMemo, JSX, splitProps } from "solid-js";

export type SlotsParams = Record<string | symbol, any[]>;
export type SlotsRecord = Record<string | symbol, (JSX.Element | ((...args: any[]) => JSX.Element))>;

type F = (...args: any) => any;

export type ParamsToSlots<T extends SlotsParams> = {
  [k in keyof T]: [] extends T[k] ? (JSX.Element | (() => JSX.Element)) : ((...args: T[k]) => JSX.Element);
};

type ParamsOf<T extends SlotsRecord, k extends keyof T> = T[k] extends F ? Parameters<T[k]> : [];

type SlotsToChildren<T extends SlotsRecord> = {
  [k in keyof T]: ChildrenReturn;
};

type SlotsToShortcuts<T extends SlotsRecord> = {
  [k in keyof T]: (...args: ParamsOf<T, k>) => ChildrenReturn;
};

export type Slots<T extends SlotsParams, prop extends string = 'children'> = {
  [k in prop]: ParamsToSlots<T>;
};

export type MapSlots<T extends Record<string | symbol, any>> = (factory: SlotsFactory<T>) => ResolvedSlots<T>;
export type SlotsFactory<T extends SlotsRecord> = (slots: SlotsToShortcuts<T>, memo: typeof objectMemo) => SlotsToChildren<T>;

export type SlotsHookParams<T extends SlotsRecord> = [
  props: { children: T },
  slots: SlotsFactory<T>,
];

export type ResolvedSlots<T extends SlotsRecord> = Record<keyof T, JSX.Element>;

export function useSlots<T extends SlotsRecord>(...[props, slots]: SlotsHookParams<T>) {
  const shortcuts = new Proxy({}, { get: (_, key: keyof T) => (...x: ParamsOf<T, keyof T>) => {
    return children(() => {
      const maybeFunction = props.children[key];

      return typeof maybeFunction === 'function'
        ? maybeFunction(...x)
        : maybeFunction;
    })
  } }) as SlotsToShortcuts<T>;

  const evaluatedSlots = slots(shortcuts, objectMemo);

  return new Proxy({}, {
    get(_, key: keyof T) {
      return evaluatedSlots[key]();
    },
  }) as ResolvedSlots<T>;
}

export function objectMemo<T extends Record<PropertyKey, any>>(getter: () => T) {
  const _getter = createMemo(getter);

  return new Proxy(_getter(), {
    get(_, p) {
      return _getter()[p];
    },
  }) as any as T;
}
