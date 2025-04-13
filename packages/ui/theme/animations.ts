import type { Rule, Shortcut } from 'unocss/index';
import { theme } from 'unocss/preset-wind';

export const animateAutocomplete = [
  `<num>-animate-init-$animation.keyframes-<num>`,
  `animate-init-$animation.keyframes-<num>`,
  `animate-init-$animation.keyframes`,
];

export const animateRule = [
  'animate-3d',
  {
    '-webkit-transform': 'translateZ(0)',
    '-webkit-perspective': '1000',
    '-webkit-backface-visibility': 'hidden',
  },
] satisfies Rule;

export const animateShortcut = [
  /(?:(\d+)-)?animate-init-((?:-?[a-z]+)+)(?:-(\d+))?/,
  ([, delay, name, duration]) => (
    `keyframes-${name} animate-delay-${delay || 0} animate-both animate-duration-${duration || 200} animate-ease animate-3d`
  ),
  {
    autocomplete: animateAutocomplete,
  },
] satisfies Shortcut;

export const keyframes = {
  ...theme.animation?.keyframes,
  'expand-y': `
    from {
    }
    to {
    }
  `,
} satisfies Record<string, string>;