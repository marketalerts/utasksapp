import WebApp from 'tma-dev-sdk';
import { merge, tap } from 'rambda';

import { isInline, runLater } from 'shared/platform';

import { defaultTimeZone } from 'f/settings/timezone-list';
import { getLocalTimezoneOffset } from 'f/settings/timezone';

import { baseFetchUtasks } from './base-client';
import type { RawBaseClient } from './base-client';

const tokenKey = 'token';
const tokenExpKey = 'token-expires-at';
export const devModeKey = 'dev-mode';
export const startParamKey = 'start-key';

interface JwtData {
  exp: number;
  sub: string;
}

export const getLocalToken = () => {
  const expires = Number(sessionStorage.getItem(tokenExpKey) ?? undefined);

  if (!isNaN(expires) && expires <= new Date().getTime()) {
    sessionStorage.removeItem(tokenKey);
    sessionStorage.removeItem(tokenExpKey);

    return undefined;
  }

  return sessionStorage.getItem(tokenKey) ?? undefined;
};

export const setLocalToken = (value: string, expiresInSeconds: number) => {
  sessionStorage.setItem(tokenKey, value);
  sessionStorage.setItem(tokenExpKey, String(expiresInSeconds * 1000));
};

const sendAuthRequest = (client: RawBaseClient) => (
  // TODO: enable any third-party metrics here
  runLater(() => // race with 15 sec timeout to determine wether the authorization took too long
    Promise.race([
      requestAuthToken(client),
      runLater<false>(() => false, Number(sessionStorage.getItem('auth-race') ?? '5000')),
    ])
      .then(r => {
        if (!r || r.error) {
          runLater(() => requestAuthToken.forget());

          // @ts-expect-error lacking error types from backend
          throw !r ? { status: 500 } : r.error;
        }

        return r;
      }),
    Number(sessionStorage.getItem('auth-delay') ?? '0'),
  )
);

export const fetchToken = async () => {
  return getLocalToken() ??
    await baseFetchUtasks
      .then(sendAuthRequest)
      .then(r => r.data)
      .then(tap(token => {
        if (!token) {
          return;
        }

        const { exp: expires } = JSON.parse(window.atob(token.split('.')[1])) as JwtData;
        setLocalToken(token, expires);
      }));
};

const createAuthHeader = (token?: string): {
  Authorization?: string;
} => token ? { 'Authorization': `Bearer ${token}` } : {};

export const getAutorizedHeaders = (
  withHeaders?: Record<string, string>,
  getAuthHeader = () => fetchToken().then(createAuthHeader),
) => getAuthHeader().then(auth => merge(auth, withHeaders));

const requestAuthToken = remember((client: RawBaseClient) => {
  const requestWriteAccess = () => {
    if (WebApp.initDataUnsafe?.user?.allows_write_to_pm || isInline()) {
      return Promise.resolve();
    }

    if (!WebApp.initDataUnsafe) {
      return Promise.reject();
    }

    return new Promise<void>((res, rej) => {
      WebApp.requestWriteAccess(access => {
        if (access) {
          res();
        } else {
          rej();
        }
      });
    });
  };

  return requestWriteAccess()
    .catch(() => WebApp.close())
    .then(() => client.POST('/api/auth', {
      params: {
        query: {
          initData: isQaModeEnabled() ? WebApp.initData || Number(localStorage.getItem('qa')) : WebApp.initData,
          timeZone: getLocalTimezoneOffset(),
          timeZoneId: defaultTimeZone,
          projectId: sessionStorage.getItem(startParamKey) || undefined,
          locale: (() => {
            try {
              return new Intl.Locale(window.navigator.language).language;
            } catch {
              try {
                return new Intl.Locale(new Intl.DateTimeFormat().resolvedOptions().locale).language;
              } catch {
                return 'en';
              }
            }
          })(),
          qa: isQaModeEnabled() ? WebApp.initDataUnsafe.user?.id ?? Number(localStorage.getItem('qa')) : undefined,
        },
      },
    }));

});

export function isQaModeEnabled() {
  return import.meta.env.APP_ENV !== 'prod' && (
    !!localStorage.getItem('qa')
    || [location.search, location.hash].some(s => /(&|\?|#)qa($|&)/.test(s))
  );
}

export function remember<T, A extends any[]>(request: (...args: A) => Promise<T>): {
  (...args: A): Promise<T>;
  forget(): void;
} {
  let result: Promise<T> | null = null;

  const rememberedRequest = (...args: A) => {
    return result ??= request(...args)
      .catch(e => {
        result = null;

        throw e;
      });
  };

  rememberedRequest.forget = () => {
    result = null;
  };

  return rememberedRequest;
}
