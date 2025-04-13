import { definePreset, presetUno, Rule, Shortcut } from 'unocss';

import transformers from './transformers';
import { fontRule } from './fonts';
import colors, { colorShortcuts } from './colors';
import legacy from './_legacy';
import { animateRule, animateShortcut, keyframes } from './animations';

export default definePreset(() => ({
  name: 'ui/theme',

  presets: [presetUno, legacy],
  transformers,
  theme: {
    colors,
    animations: {
      keyframes,
    },
  },
  shortcuts: [
    animateShortcut,
    ...colorShortcuts,
    {
      'ellipsis': 'whitespace-nowrap overflow-hidden text-ellipsis',
    },
  ],
  rules: [
    animateRule,
    fontRule,
  ],
  variants: [
    {
      name: 'this-and-children',
      autocomplete: '**:',
      match(matcher: string) {
        if (!matcher.startsWith('**:')) {
          return matcher;
        }

        return {
          matcher: matcher.slice(3),
          selector: (s: string) => `${s},${s} *`,
        };
      },
    },
  ],
}));