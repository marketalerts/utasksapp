import type { Shortcut } from 'unocss/index';
import { importTokenColors } from '../parsers/tokens/colors';

import tokens from '../../tokens/theme.json';
const colorTokens = importTokenColors(tokens);

console.log(colorTokens);


const colors = {
  /* background - to avoid bg-bg-* */
  primary: 'var(--tg-theme-bg-color)',
  secondary: 'var(--tg-theme-secondary-bg-color)',
  section: 'var(--tg-theme-section-bg-color)',
  header: 'var(--tg-theme-header-bg-color)',
  footer: 'var(--tg-theme-bottom-bar-bg-color)',

  text: {
    primary: 'var(--tg-theme-text-color)',
    secondary: 'var(--tg-theme-subtitle-text-color)',
    tertiary: 'var(--tg-theme-hint-color)',
    accented: 'var(--tg-theme-accent-text-color)',
    link: 'var(--tg-theme-link-color)',
    negative: 'var(--tg-theme-destructive-text-color, #EB4D3D)',
    header: 'var(--tg-theme-section-header-text-color)',
    button: 'var(--tg-theme-button-text-color)',
    disabled: 'var(--tg-theme-hint-color)',
  },

  icon: {
    get primary() { return colors.text.primary; },
    get secondary() { return colors.text.secondary; },
    tertiary: 'color-mix(in srgb, var(--tg-theme-hint-color), transparent)',
    get tertiaryLegacy() { return colors.text.tertiary; },
    get accented() { return colors.text.accented; },
    get disabled() { return colors.text.disabled; },
    get negative() { return colors.text.negative; },
  },

  border: {
    regular: 'var(--border-color)', // TODO: use tg color? section_separator?
  },

  button: {
    primary: {
      bg: 'var(--tg-theme-button-color)',
      get text() { return colors.text.accented; },
      disabled: 'color-mix(in srgb, var(--tg-theme-hint-color), transparent)',
      disabledLegacy: 'var(--tg-theme-hint-color)',
    },
    secondary: {
      bg: 'transparent',
      text: 'var(--tg-theme-button-color)',
      disabled: 'transparent',
    },
    tertiary: {
      bg: 'transparent',
      get text() { return colors.text.tertiary; },
      disabled: 'transparent',
    },
  },

  app: colorTokens,
};

export default colors;

export const colorShortcuts = [
  [/ui-button-(\w+)/, ([, type], { theme }) => type in theme.colors.button ? [
    `bg-button-${type}-bg`,
    `c-button-${type}-text`,
    `hover:filter-saturate-120`,
    `disabled:(bg-button-${type}-disabled c-text-disabled)`,
  ] : undefined, {
    autocomplete: 'button-$colors.button',
  }] satisfies Shortcut<{ colors: typeof colors }>,
  [/ui-icon-(\w+)/, ([, type], { theme }) => type in theme.colors.icon ? [
    `fill-app-icon-${type}`,
  ] : undefined, {
    autocomplete: 'icon-$colors.icon',
  }] satisfies Shortcut<{ colors: typeof colors }>,
];