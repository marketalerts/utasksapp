import { join } from 'path';
import { readdir, writeFile } from 'fs/promises';
import { readdirSync } from 'fs';
import { log, warn } from 'console';

import { fetch } from 'undici';
import { filter, map } from 'rambda';

import { options } from './firebase-env.js';
import { fetchConfig } from './firebase-config.js';

const config = await fetchConfig(options());
const realtimeDatabaseLink = options().databaseURL;
const featuresDir = 'src/legacy/features';
const localesDir = 'locales';
const remoteLocalesDir = 'utf/locales';
const locales = config.locales ?? ['en', 'ru', 'es', 'fa'];

log('🎯 Target url:', realtimeDatabaseLink);

await readdir('./src/legacy/features')
  .then(filter(f => readdirSync(join('./src/legacy/features', f)).includes(localesDir)))
  .then(map(downloadLocales))
  .then(list => Promise.all(list))
  .then(map(([feature, locales]) => locales.map(writeLocaleFor(feature))))
  .then(list => Promise.all(list.map(sl => Promise.all(sl))));

log('✅ Done');

/**
 * @param {string} feature
 */
function writeLocaleFor(feature) {
  /**
   * @param {[string, string]}
   */
  return ([locale, data]) => {
    if (JSON.parse(data) == null) {
      warn(`❌ No ${locale} locale found for ${feature}, not writing anything`);
      return;
    }

    const localePath = join(featuresDir, feature, localesDir, locale + '.json');

    log(`🏭 Writing ${feature} ${locale} locale data to path ${localePath}`);

    return writeFile(
      localePath,
      JSON.stringify(JSON.parse(data), null, 2),
      'utf-8'
    );
  };
}

/**
 * @param {string} feature
 */
function downloadLocales(feature) {
  return Promise.all([
    feature,
    Promise.all(locales.map(downloadLocaleFor(feature))),
  ]);
}

/**
 * @param {string} feature
 */
function downloadLocaleFor(feature) {
  const localeUrl = locale => [realtimeDatabaseLink, remoteLocalesDir, locale, feature + '.json'].join('/');

  /**
   * @param {string} locale
   */
  return locale => Promise.all([
    locale,
    fetch(localeUrl(locale))
      .then(r => (
        log(`🌐 Downdloaded locale from ${localeUrl(locale)}`),
        r.text()
      ))
      .catch(e => (
        log(`❌ Failed to downdload locale from ${localeUrl(locale)}:`, e),
        log(`Trying again...`),

        new Promise(res => setTimeout(() => (
          fetch(localeUrl(locale))
            .then(r => (
              log(`🌐 Downdloaded locale from ${localeUrl(locale)}`),
              res(r.text())
            ))
            .catch(e => (
              log(`❌ Failed to downdload locale from ${localeUrl(locale)}:`, e),
              res('null')
            ))
        ), 1000))
      )),
  ]);
}
