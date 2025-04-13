import createClient from 'openapi-fetch';

import { configFetching, getConfigString, app } from 'shared/firebase';

import type { paths } from './schema';

const backendUrlConfigKey = (import.meta.env.APP_CONFIG_BACKENDURL ?? 'backurl') as 'backurl';

const backendUrl = () => getConfigString(backendUrlConfigKey);

export let resolvedBackendUrl = (import.meta.env.APP_BACKEND ?? 'https://app.utasks.io/utb');

export const baseConfig = import.meta.env.APP_ENV !== 'prod' ? configFetching.then(() => (
  backendUrl().then(newBaseUrl => {
    resolvedBackendUrl = newBaseUrl || resolvedBackendUrl;

    app.then((c) => {
      console.info(`Version: v${import.meta.env.APP_VERSION}:${import.meta.env.APP_BUILD}`);
      console.info(`Environment: ${c?.options.projectId}:${new URL(resolvedBackendUrl).hostname}`);
    });

    return {
      baseUrl: resolvedBackendUrl,
    } satisfies Parameters<typeof createClient>[0];
  })
)) : Promise.resolve({
  baseUrl: resolvedBackendUrl,
} satisfies Parameters<typeof createClient>[0]);

export const baseFetchUtasks = baseConfig.then(c => createClient<paths>(c));

export type RawBaseClient = typeof baseFetchUtasks extends Promise<infer T> ? T : never;

export type BaseClient = {
  [key in keyof RawBaseClient as Lowercase<key>]: RawBaseClient[key];
};

export function download(url: string, headers: HeadersInit, setFileProgress?: (percent?: number) => void) {
  const xhr = new XMLHttpRequest();
  return [new Promise<Blob>((resolve, reject) => {
    xhr.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        setFileProgress?.((event.loaded / event.total) * 100);
      }
    });

    xhr.addEventListener('loadend', () => {
      setFileProgress?.(100);
      if (xhr.status >= 400) {
        reject(xhr.response);
      } else {
        resolve(xhr.response);
      }
    });

    xhr.addEventListener('error', (e) => {
      reject(e);
    });

    xhr.open('GET', url, true);
    xhr.responseType = 'blob';
    for (const [name, value] of Object.entries(headers)) {
      xhr.setRequestHeader(name, value);
    }

    try {
      xhr.send();
    } catch (error) {
      reject(error);
    }
  }), () => xhr.abort()] as const;
}

export function upload(url: string, headers: HeadersInit, data: FormData, setFileProgress: (percent?: number) => void) {
  const xhr = new XMLHttpRequest();
  return [new Promise<unknown>((resolve, reject) => {
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        setFileProgress((event.loaded / event.total) * 100);
      }
    });

    xhr.addEventListener('loadend', () => {
      setFileProgress(100);

      if (xhr.status >= 400) {
        reject(xhr.response);
      } else {
        resolve(xhr.response);
      }

      setTimeout(() => setFileProgress(), 500);
    });

    xhr.addEventListener('error', (e) => {
      reject(e);
    });

    xhr.open('POST', url, true);

    for (const [name, value] of Object.entries(headers)) {
      xhr.setRequestHeader(name, value);
    }

    try {
      xhr.send(data);
    } catch (error) {
      reject(error);
    }
  }), () => xhr.abort()] as const;
}
