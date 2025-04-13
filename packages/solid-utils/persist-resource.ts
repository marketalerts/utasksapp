import { UseStore, createStore, get, set } from 'idb-keyval';
import { Owner, createResource, getOwner, runWithOwner } from 'solid-js';

let _resources: UseStore | undefined;

const resources = (() => {
  try {
    return _resources ??= createStore('utasks', 'resources');
  } catch (error) {
    return undefined
  }
});

// Simple in-memory storage, should persist until the app is closed
// Used as a synchronous cache for indexeddb
const storage: Record<string, any> = {};

export function persistResource<T>(options: {
  key: () => string;
  defaultValue: T;
  serialize?: (v: T) => object;
  deserialize?: (v: any) => T;
  owner?: Owner;
}) {
  const {
    key,
    defaultValue,
    owner = getOwner()
  } = options;

  async function getPromise(): Promise<T> {
    try {
      const val = await get<T>(key(), resources());
      const deserialized = options.deserialize?.(val) ?? val;

      storage[key()] = deserialized;

      return deserialized ?? defaultValue;
    } catch {
      return storage[key()];
    }
  }

  // Skip resource initialization outside of solid components,
  // as there it will be useless
  const [dbResource] = owner ? runWithOwner(
    owner,
    () => createResource<T, string, T>(key, async k => {
      try {
        const res = await get(k, resources());

        return options.deserialize?.(res) ?? res ?? getLocal() ?? defaultValue;
      } catch (error) {
        return getLocal() ?? defaultValue;
      }
    }, { initialValue: storage[key()] ?? defaultValue })
  )! : [undefined] as const;

  function getLocal(): T {
    try {
      const localVal = storage[key()];

      return localVal ?? dbResource?.latest ?? defaultValue;
    } catch {
      return defaultValue;
    }
  };

  const setLocal = (v?: T | ((prev?: T) => T)) => {
    // @ts-expect-error ridiculous typing from solid-js
    const val: T = typeof v === 'function' ? v(defaultValue) : v;

    try {
      if (val != null) {
        try {
          set(key(), options.serialize?.(val) ?? val, resources())
            // Silence transaction errors, as unsuccessful caching
            // shouldn't interfere with the app
            .catch(() => undefined);
        } catch (error) {
          // Another catch here, since most engines optimize promise execution
          // so that the synchronous part is not scheduled as a microtask,
          // but rather is run directly in the same microtask as it was created in,
          // therefore requiring a synchronous catch
          console.warn('[persist-resource] Value only persisted temporarily:', error);
        }
      }

      storage[key()] = val ?? defaultValue;
    } catch (e) {
      console.error('[persist-resource] Unable to persist value:', e);
    }

    return val ?? defaultValue;
  };

  return [
    getLocal,
    setLocal,
    getPromise,
  ] as const;
}
