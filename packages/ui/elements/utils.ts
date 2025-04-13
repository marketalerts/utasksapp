export function createArray<T>(length: number, map: (index: number) => T) {
  return Array.from({ length }, (_, i) => map(i));
}

export type VirtualArray<T> = Array<T> & {
  length: number;
};

export function createVirtualArray<T>(length: () => number, map: (index: number) => T): VirtualArray<T> {
  const memo = {
    get length() {
      return length();
    },
  } as VirtualArray<T>;

  const proxy = new Proxy(memo, {
    get(target, p) {
      if (p === 'slice') {
        return () => proxy;
      }

      if (typeof p !== 'number') {
        return target[p as keyof typeof target];
      }

      return memo[p] ??= map?.(p) ?? p;
    },
  });

  return proxy;
}

export const runLater = <T>(cb: () => T, delay?: number): Promise<Awaited<T>> => (
  new Promise((res, rej) => (
    setTimeout(async () => {
      try {
        res(await cb());
      } catch (error) {
        rej(error);
      }
    }, delay)
  ))
);
