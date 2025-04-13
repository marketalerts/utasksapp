import { writeFileSync } from 'fs';

import { options } from './firebase-env.js';
import { fetchConfig } from './firebase-config.js';

const envs = [
  'development.local',
  'production',
  'dev',
];
const configs = await Promise.all(
  envs.map(name => Promise.all([name, fetchAndParseConfigFor('./.env.' + name)]))
);

for (const [name, config] of configs) {
  writeFileSync(`src/config/config.${name}.json`, JSON.stringify(config, null, 2));
}

function fetchAndParseConfigFor(env) {
  return fetchConfig(options(env)).then(parseConfig);
}

function parseConfig(config) {
  return Object.fromEntries(
    Object.entries(config.entries)
      .map(([key, value]) => {
        try {
          return [key, JSON.parse(value)];
        } catch {
          return [key, value];
        }
      })
  );
}

