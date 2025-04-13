import { basename, dirname, extname, join } from 'path/posix';
import { readFileSync } from 'fs';
import { createHash } from 'crypto';

import { mergeConfig } from 'vite';
import type { PluginOption, ResolvedConfig } from 'vite';

const pluginName = 'vite-plugin-dynamic-import-json';

export interface NativeJsonConfig {
  /**
   * Overrides/replaces vite's json.namedExports for imported/matched files
   */
  namedExports?: boolean;

  /**
   * By-default, all dynamically-imported .json files are included,
   * but this option allows to process a specific subset of files
   */
  include?: Array<string | RegExp> | ((filePath: string) => boolean);

  /**
   * Function to transform original file path to a path in `build.assetsDir`.
   *
   * By-default, the original path is kept as is,
   * and the base file name is transformed in a typical rollup fashion.
   *
   * @param filePath the original path to the imported file
   * @param importerFilePath path to the file that imported the above file
   * @returns a file path in the `assetsDir`
   */
  toAssetPath?: (filePath: string, source: string, importerFilePath: string) => string;

  /**
   * Determines how to process the dynamic import.
   *
   * Should return a tuple with two strings:
   * - a string to replace the left part - `import(`
   * - a string to replace the right part - `)`
   *
   * By default, replaces the import with `fetch()` call
   * that also processes the result to imitate a native module.
   *
   * It's also easy to conditionally keep the default behavior
   * by importing the `defaultReplaceImport` function to use inside of this one
   *
   * @param filePath the original path to the imported file
   * @param config viteConfig
   * @returns what to write instead of the original import
   */
  replaceImport?: (filePath: string, config: ResolvedConfig) => [string, string];
}

export const defaultReplaceImport: Required<NativeJsonConfig>['replaceImport'] = (
  (_, config) => [
    `fetch('${config.base}'+`,
    config.json?.namedExports
      ? ').then(async r => { const json = await r.json(); json.default??=json; return json; })'
      : ').then(r => r.json()).then(r => ({ default: r }))',
  ]
);

export const defaultToAssetPath: Required<NativeJsonConfig>['toAssetPath'] = (
  renderFileName
);

export default function (pluginConfig?: NativeJsonConfig): PluginOption {
  let config: ResolvedConfig;
  const fileMap: Record<string, string> = {};

  const {
    include = path => path.endsWith('.json'),
    namedExports,
    toAssetPath = defaultToAssetPath,
    replaceImport = defaultReplaceImport,
  }: NativeJsonConfig = pluginConfig ?? {};

  const isIncluded = (
    Array.isArray(include)
      ? (path: string) => include.some(s => (
        typeof s === 'string'
          ? path.includes(s)
          : s.test(path)
      ))
      : include
  );

  const readFile = (path: string) => JSON.stringify(JSON.parse(String(readFileSync(path))));

  return {
    name: pluginName,
    enforce: 'pre',

    configResolved(_config) {
      config = mergeConfig(_config, {
        json: typeof namedExports !== 'undefined'
          ? { namedExports }
          : {},
      }) as ResolvedConfig;
    },

    resolveDynamicImport(specifier, importer) {
      const relativePath = specifier.toString();

      if (!isIncluded(relativePath)) {
        return;
      }

      const fullPath = join(dirname(importer), relativePath);
      const source = readFile(fullPath);

      const assetPath = toAssetPath(relativePath, source, importer);

      const fileName = join(
        config.build.assetsDir,
        assetPath
      );

      this.emitFile({
        type: 'asset',
        fileName,
        source,
      });


      fileMap[fileName] = fullPath;

      return {
        id: fileName,
        external: 'relative',
        resolvedBy: pluginName,
      };
    },

    renderDynamicImport(options) {
      const fileName = options.targetModuleId;

      if (
        fileName
        && isIncluded(fileName)
        && fileName in fileMap
      ) {
        const [left, right] = replaceImport(
          fileMap[fileName],
          config
        );

        return {
          left,
          right,
        };
      }
    },
  };
}

function renderFileName(fileName: string, source: string) {
  const ext = extname(fileName).slice(1);
  const hash = getHash(source).slice(0, 8);
  const name = basename(fileName).replace(`.${ext}`, '');

  return join(fileName.replace(basename(fileName), ''), `${name}-${hash}.${ext}`);
}

function getHash(source: string): string {
  return createHash('sha256').update(source).digest('hex');
}
