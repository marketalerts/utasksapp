import type { RemoteConfig } from 'src/config';

import { fetchAndActivate, getRemoteConfig, getString, getNumber, initializeApp } from './foundation';

const defaultConfig = { /* [REDACTED] */ };

export const firebaseConfig = Promise.resolve<typeof defaultConfig>(
  import.meta.env.APP_FIREBASE_CONFIG
  ? JSON.parse(import.meta.env.APP_FIREBASE_CONFIG)
  : defaultConfig,
);

export const app = firebaseConfig.then(initializeApp);
export const config = app.then(getRemoteConfig);
export const configFetching = (config.then(fetchAndActivate).then(() => config)).catch(() => config);

export const getConfigNumber = (key: keyof RemoteConfig) => configFetching.then(c => getNumber(c, key));
export const getConfigString = (key: keyof RemoteConfig) => configFetching.then(c => getString(c, key));
export const getConfigArray = <T>(key: keyof RemoteConfig): Promise<T[]> => configFetching.then(c => getString(c, key).then(v => v ? JSON.parse(v) as T[] : []).catch(() => [] as T[]));
export const getConfigBoolean = (key: keyof RemoteConfig) => configFetching.then(c => getString(c, key).then(v => v ? JSON.parse(v) as boolean : undefined));
export const getConfigRaw = (key: keyof RemoteConfig) => configFetching.then(c => getString(c, key));
