import { dirname, join } from 'path/posix';
import { execSync } from 'child_process';

import tsconfigPaths from 'vite-tsconfig-paths';
import { vitePluginTypescriptTransform } from 'vite-plugin-typescript-transform';
import solidSVG from 'vite-plugin-solid-svg';
import { VitePWA } from 'vite-plugin-pwa';
import { loadEnv } from 'vite';
// eslint-disable-next-line import/order
import UnoCSS from 'unocss/vite';
import { defineConfig } from '@solidjs/start/config';

// Vite is unable to transpile .ts from absolute imports
import dynamicImportJSON, { defaultToAssetPath } from '../../packages/vite-plugin-dynamic-import-json';

import info from './package.json';
import { ScriptTarget } from 'typescript';


const svgPrefix: Record<string, string> = {};
let incPrefix = 0;

type CustomizableConfig = Omit<
	import('vite').InlineConfig,
	| 'appType'
	| 'app'
	| 'router'
	| 'base'
	| 'root'
	| 'publicDir'
	| 'mode'
	| 'server'
	| 'preview'
	| 'clearScreen'
	| 'configFile'
	| 'envFile'
> & {
	build?: Omit<
		import('vite').InlineConfig['build'],
		'outDir' | 'ssr' | 'ssrManifest' | 'rollupOptions'
	> & {
		rollupOptions?: Omit<import('vite').BuildOptions['rollupOptions'], 'input'>;
	};
};

const latestCommit = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8)
  ?? process.env.CI_COMMIT_SHORT_SHA
  ?? (process.dev ? 'test' : 'production');

export default (isDev: boolean) => {
  const env = loadEnv(isDev ? 'dev' : 'production', process.cwd(), 'APP_');

  console.log(isDev ? 'dev' : 'production', 'mode');
  console.log(env);

  return defineConfig({
    ssr: false,

    server: {
      preset: 'static',
      compressPublicAssets: { brotli: !isDev, gzip: !isDev },
    },

    vite: {
      build: {
        sourcemap: isDev,
        minify: true,
        target: 'es2020',
      },

      define: {
        'import.meta.env.APP_BASE': JSON.stringify(env.APP_BASE),
        'import.meta.env.APP_BACKEND': JSON.stringify(env.APP_BACKEND),
        'import.meta.env.APP_FIREBASE_CONFIG': JSON.stringify(env.APP_FIREBASE_CONFIG),
        'import.meta.env.APP_CONFIG_BACKENDURL': JSON.stringify(env.APP_CONFIG_BACKENDURL),
        'import.meta.env.APP_ENV': JSON.stringify(env.APP_ENV),
        'import.meta.env.APP_BUILD': JSON.stringify(latestCommit),
        'import.meta.env.APP_VERSION': JSON.stringify(env.DEPLOY_TAG ?? info.version),
      },

      envPrefix: 'APP_',
      plugins: [
        vitePluginTypescriptTransform({
          enforce: 'pre',
          filter: {
            files: {
              include: /src\/.*\.ts$/,
            },
          },
          tsconfig: {
            override: {
              target: ScriptTarget.ES2020,
            },
          },
        }),
        dynamicImportJSON({
          toAssetPath(filePath, source, importerFilePath) {
            if (filePath.includes('config.')) {
              const env = /^.*\/config\.(.*)\.json$/.exec(filePath)?.[1];

              return defaultToAssetPath(join(
                env === 'prod' ? 'prod' : 'test',
                `config.${env}.json`
              ), source, importerFilePath);
            }

            if (importerFilePath.includes('locales'))
              return defaultToAssetPath(join(
                'locales',
                /^.*\/features\/(.+)\/locales\/.*$/.exec(importerFilePath)?.[1] ?? dirname(importerFilePath),
                filePath.toString()
              ), source, importerFilePath);

            return defaultToAssetPath(filePath, source, importerFilePath);
          },
        }),
        tsconfigPaths(),
        UnoCSS(),
        solidSVG({
          defaultAsComponent: true,
          svgo: {
            enabled: true,
            svgoConfig: {
              plugins: [
                // set of built-in plugins enabled by default
                'preset-default',

                // enable built-in plugins by name
                {
                  name: 'prefixIds',
                  params: {
                    delim: '_',
                    prefixIds: true,
                    prefixClassNames: true,
                    prefix(node, info) {
                      return String(incPrefix++);
                    },
                  },
                },
                // 'cleanupIDs',
              ],
            },
          },
        }),

        VitePWA({
          registerType: 'autoUpdate',
          devOptions: {
            enabled: false,
            type: 'module',
          },

          workbox: {
            globPatterns: ['**/*.{js,css,html,json}'],
            cleanupOutdatedCaches: true,
          },

          manifest: {
            name: info.displayName,
            short_name: info.displayName,
            description: info.description,
          },
        }),
      ],
    } satisfies CustomizableConfig,
  });
};
