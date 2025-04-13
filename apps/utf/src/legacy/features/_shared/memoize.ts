import { createEffect, createSignal } from 'solid-js';
import type { Signal } from 'solid-js';
import { createMarker } from '@solid-primitives/marker';

export const memoize = <F extends (...args: any[]) => any, K extends PropertyKey>(
  f: F,
  getKey: (...args: Parameters<F>) => K,
): F => {
  const memory: Record<PropertyKey, ReturnType<F>> = {};

  return function (this: unknown, ...args: Parameters<F>): ReturnType<F> {
    return memory[getKey(...args)] ??= f.apply(this, args);
  } as F;
};

export const Memoize = <F extends (...args: any[]) => any, K extends PropertyKey>(
  getKey: (...args: Parameters<F>) => K,
) => (originalMethod: F, _ctx: ClassMethodDecoratorContext) => {
  return memoize(originalMethod, getKey);
};

export class Marker<T> {
  #pattern: Signal<RegExp>;
  #mark!: Signal<ReturnType<typeof createMarker<T>>>;

  constructor(mapMatch: (match: () => string) => T, options: {
    pattern: RegExp;
    dependencies?: () => void;
    cacheSize?: number;
  }) {
    this.#pattern = createSignal(options.pattern);
    this.#mark = createSignal(createMarker(mapMatch, options));

    createEffect(() => {
      options.dependencies?.();

      this.createMark(mapMatch, options);
    });
  }

  private createMark(mapMatch: (match: () => string) => T, options: { cacheSize?: number; }) {
    this.#mark[1](() => createMarker(mapMatch, options));
  }

  setPattern(pattern: RegExp) {
    this.#pattern[1](pattern);
  }

  mark(text: string) {
    return this.#mark[0]()(text, this.#pattern[0]());
  }
}