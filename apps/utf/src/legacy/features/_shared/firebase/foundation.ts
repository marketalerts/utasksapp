if (import.meta.env.APP_ENV === 'dev') {
  indexedDB.deleteDatabase('firebase_remote_config');
}

export type RemoteConfig = typeof import('../../../../config/config.production.json');

import type { RemoteConfig as RC } from '@firebase/remote-config';
import type { FirebaseApp, FirebaseOptions } from '@firebase/app';

import { importConfig } from '~/config';

let useApp: <T>(context: (fb: typeof import('@firebase/app')) => T) => Promise<T | undefined>;
let useConfig: <T>(context: (fbrc: typeof import('@firebase/remote-config')) => T | Promise<T>) => Promise<T | undefined>;

if (import.meta.env.APP_ENV === 'dev') {
  useApp = <T>(context: (fb: typeof import('@firebase/app')) => T) => (
    import('@firebase/app')
      .then(context)
      .catch(() => undefined)
  );

  useConfig = <T>(context: (fbrc: typeof import('@firebase/remote-config')) => T | Promise<T>) => (
    import('@firebase/remote-config')
      .then(fbrc => context(fbrc))
      .catch(() => undefined)
  );
} else {
  // @ts-expect-error transition period
  useConfig = () => {
    return importConfig();
  };
}

export const initializeApp = import.meta.env.APP_ENV === 'dev'
  ? (options: FirebaseOptions, name?: string): Promise<FirebaseApp | undefined> => useApp(fb => fb.initializeApp(options, name))
  : () => Promise.resolve(undefined);

export const getRemoteConfig = import.meta.env.APP_ENV === 'dev'
  ? (app?: FirebaseApp): Promise<RC | undefined>=> useConfig(async fbrc => fbrc.getRemoteConfig(app))
  : (app?: any) => useConfig(() => app);

export const fetchAndActivate = import.meta.env.APP_ENV === 'dev'
  ? (rc: RC | undefined): Promise<boolean | undefined> => useConfig(fbrc => rc ? fbrc.fetchAndActivate(rc) : false)
  : Promise.resolve.bind(Promise);

export const getString = import.meta.env.APP_ENV === 'dev'
  ? (
    rc: RC | undefined,
    key: string,
  ) => useConfig(fbrc => rc ? fbrc.getString(rc, key) : undefined)
  : async (
    rc: RemoteConfig | undefined,
    key: keyof RemoteConfig,
  ) => typeof rc === 'object'
      ? typeof rc[key] === 'object'
        ? JSON.stringify(rc[key])
        : String(rc[key])
      : undefined;

export const getNumber = import.meta.env.APP_ENV === 'dev'
  ? (
    rc: RC | undefined,
    key: string,
  ) => useConfig(fbrc => rc ? fbrc.getNumber(rc, key) : undefined)
  : async (
    rc: RemoteConfig | undefined,
    key: keyof RemoteConfig,
  ) => typeof rc?.[key] === 'number' ? rc?.[key] : undefined;
