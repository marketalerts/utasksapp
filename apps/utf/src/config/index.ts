export type RemoteConfig = typeof import('./config.prod.json');

const importPublicConfigFile = (env: string) => (
  import(`./config.${env}.json`)
    .then(r => r.default)
    .catch(() => import('./config.test.json').then(r => r.default))
);

export function importConfig() {
  if (import.meta.env.APP_ENV === 'sandbox') {
    return importPublicConfigFile('sandbox');
  }

  if (import.meta.env.APP_ENV === 'test' || import.meta.env.APP_ENV === 'prod') {
    return importPublicConfigFile(import.meta.env.APP_ENV);
  }

  return importPublicConfigFile('prod');
}
