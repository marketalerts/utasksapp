import type { CSSObject, Rule } from 'unocss';

import { legacyFontGen } from '../_legacy';
import type { FontClass, ModifierRecord, Modifier } from './helpers';
import { fontClassifiers, fontModifiers } from './definitions';

/**
 * ```js
 * /^app-text-(\w+)(?:-(\w+))?(-stable)?$/
 *
 * "app-text-body-l/regular"
 * ```
 *
 * Available fonts: see fontClassifiers
 *
 * Available modifiers: see fontModifiers
 */
export const fontRule = [
  /^app-text-([\w-]+)(?:\/([\w-]+?))?(-stable)?$/,
  ([, size, mod, isStable]) => getFont(size, mod, !!isStable) ?? legacyFontGen(['', size, isStable]),
  {
    autocomplete: `app-text-(${Object.keys(fontClassifiers).join('|')})/(${Object.keys(fontModifiers).join('|')})`,
  },
] satisfies Rule;

function getFont(size: string, modifier?: string, isStable?: boolean) {
  const toCss = (font: FontClass, mod?: Modifier): CSSObject => {
    font = { ...font, ...mod?.(font) };

    const lh = toRem(font.lineHeight);

    return {
      'font-size': typeof font.fontSize === 'string' ? font.fontSize : toRem(font.fontSize),
      'line-height': lh,
      'font-weight': `${font.weight ?? 400}`,

      'min-height': isStable ? lh : undefined,
    };
  };

  const font = fontClassifiers[size as keyof typeof fontClassifiers];
  const mod = fontModifiers[modifier as keyof typeof fontModifiers];

  if (font) {
    return toCss(font, normalizeMod(mod));
  }

  return undefined;

  function toRem(valuePx: number) {
    return `${valuePx / 16}rem`;
  }
}

const normalizeMod = (mod?: ModifierRecord): Modifier => Array.isArray(mod)
  ? (f) => ({ ...f, weight: mod[0], ...typeof mod[1] === 'function' ? mod[1](f) : mod[1] })
  : (f) => ({ ...f, ...typeof mod === 'function' ? mod(f) : mod });
