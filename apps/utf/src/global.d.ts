/// <reference types="@solidjs/start/env" />
/// <reference types="icons" />


interface ImportMetaEnv {
  APP_ENV?: 'prod' | 'test' | 'sandbox' | 'dev';
  APP_BUILD?: string;
  APP_VERSION?: string;
  APP_BACKEND?: string;
  APP_BASE?: string;
  APP_FIREBASE_CONFIG?: string;
  APP_CONFIG_BACKENDURL?: string;
  APP_SENTRY_ID?: string;
}

interface String {
  toUpperCase<T extends string>(): Uppercase<T>;
  toLowerCase<T extends string>(): Lowercase<T>;
}
