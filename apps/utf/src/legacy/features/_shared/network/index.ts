import createClient from 'openapi-fetch';

import { baseConfig } from './base-client';
import type { BaseClient, RawBaseClient } from './base-client';
import { getAutorizedHeaders } from './auth';

let fetchUtasksWithToken: RawBaseClient;

export const fetchUtasks = new Proxy<BaseClient>({} as BaseClient, {
  get(_, _key: keyof BaseClient) {
    const key = _key.toUpperCase<keyof BaseClient>();

    if (fetchUtasksWithToken) {
      return fetchUtasksWithToken[key];
    }

    return async (...args: Parameters<RawBaseClient[typeof key]>) => {
      const finalConfig = await baseConfig;

      const headers = await getAutorizedHeaders();

      fetchUtasksWithToken = createClient({
        ...finalConfig,
        headers,
      });

      const requester = fetchUtasksWithToken[key];

      return (requester as any)(...args);
    };
  },
});

type ApiResponse<T, E = unknown> = { data?: T, error?: E, response: Response };

export const convertResponse: {
  <T, R>(converter: (r: T) => R): <E>(response: ApiResponse<T, E>) => ApiResponse<R, E>;
} = <T, R>(converter: (r: T) => R) => <E>(response: ApiResponse<T, E>) => ({
  ...response,
  data: response.data && converter(response.data),
});

export * as Schema from './schema';

export function dedupe<T, A extends any[]>(
  request: (signal: AbortSignal, ...args: A) => Promise<T>,
  shouldCancelLast: (...args: A) => boolean = () => true,
) {
  let prevAbort = new AbortController();

  return (...args: A) => {
    if (shouldCancelLast(...args)) {
      prevAbort.abort();
      prevAbort = new AbortController();
    }

    return request(prevAbort.signal, ...args);
  };
}

export { remember } from './auth';
