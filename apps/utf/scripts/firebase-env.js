import { readFileSync } from 'fs';

let envs = {};

const env = (name = './.env.dev.local') => envs[name] ??= readFileSync(name, 'utf-8');

export const options = (name) => JSON.parse(/APP_FIREBASE_CONFIG='(.*)'/img.exec(env(name))[1]);

export const backendUrlKey = (name) => /APP_CONFIG_BACKENDURL='(.*)'/img.exec(env(name))[1] ?? 'localeurl';
