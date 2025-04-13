import { definePreset } from 'unocss';
import type { CSSObject } from 'unocss';

export const legacyFontGen = ([, size, stable]: RegExpMatchArray): CSSObject => {
  if (!size) return {};

  type CSSTextMap = {
    fs: string;
    lh?: string;
    ls?: string;
    weight?: string;
  };

  const text = ({ fs: ts, lh, ls, weight }: CSSTextMap) => ({
    'font-size': ts,
    'line-height': lh ?? ts,
    'font-weight': weight,
    'letter-spacing': ls ?? '0.15px',
    ...(stable ? { 'min-height': lh } : {}),
  });

  if (/^\[\d+(px|rem)?\]$/.test(size)) {
    return text({ fs: size.slice(1, -1) });
  }

  const sizes = {
    'title': { fs: '15px', lh: '22px', weight: '600' },
    'subtitle': { fs: '13px', lh: '18px', weight: '400' },
    'new-subtitle': { fs: '13px', lh: '16px', ls: '-0.0005rem', weight: '400' },

    'base': { fs: '15px', lh: '22px', weight: '400' },
    'new-base': { fs: '17px', lh: '22px', ls: '-0.02763rem', weight: '400' },
    'smaller': { fs: '12px', lh: '14px', weight: '400' },
    'badge': { fs: '13px', lh: '18px', ls: '-0.0005rem', weight: '590' },

    'page-title-extra': { fs: '28px', lh: '34px', ls: '0.0245rem', weight: '590' },
    'page-subtitle-extra': { fs: '17px', lh: '22px', ls: '-0.02763rem', weight: '400' },

    'hint': { fs: '13px', lh: '18px', weight: '400' },


    // NEW
    'footnote': { fs: '0.8125rem', lh: '1rem', ls: '-0.0005rem', weight: '400' },
    'body-xs': { fs: '10px', lh: '8px', weight: '400' },
    'body-s': { fs: '12px', lh: '18px', weight: '400' },
    'body-l': { fs: '16px', lh: '20px', weight: '400' },
    'body-regular': { fs: '1.0625rem', lh: '1.375rem', weight: '400' },
    'body-emphasized': { fs: '1.0625rem', lh: '1.375rem', weight: '590' },
    'caption-one-regular': { fs: '0.75rem', lh: '1rem', weight: '400' },
    'caption-regular': { fs: '0.6875rem', lh: '0.8125rem', weight: '400' },
    'subheadline-emphasized': { fs: '0.9375rem', lh: '1.25rem', weight: '590' },
    'subheadline': { fs: '0.9375rem', lh: '1.25rem', weight: '400' },
    'headline': { fs: '17px', lh: '22px', weight: '590' },
    'title-2': { fs: '22px', lh: '28px', weight: '700' },
  } satisfies Record<string, CSSTextMap>;

  if (size in sizes) {
    return text(sizes[size as keyof typeof sizes]);
  }

  return text({ fs: size });
};
export default definePreset(_ => ({
  name: 'legacy',

  rules: [
    [/direction-(ltr|rtl)/, ([, dir]) => ({ 'direction': dir })],
    ['shadow-hover', { 'box-shadow': '0px 0px 16px -2px black' }],
    ['shadow-card', { 'box-shadow': '0px 12px 24px -6px rgba(31, 32, 38, 0.08), 0px 6px 12px -3px rgba(31, 32, 38, 0.04)' }],
    [/^br-(\d+)$/, ([, d]) => ({ 'border-radius': `${d}px` })],
    [/^(?:(\d+)-)?app-transition-([a-z-,]+)(?:-(\d+))?$/, ([, delay, prop, duration = 200]) => ({
      'transition-duration': `${duration}${Number(duration) > 10 ? 'm' : ''}s`,
      'transition-delay': `${delay}${Number(delay) > 10 ? 'm' : ''}s`,
      'transition-timing-function': 'ease',
      'transition-property': prop,
      'will-change': prop,
    })],
    ['text-nowrap', { 'white-space': 'nowrap' }],
    ['h-app', { height: 'var(--tg-viewport-height, 100vh)' }],
    ['h-app-stable', { height: 'var(--tg-viewport-stable-height, var(--tg-viewport-height, 100vh))' }],
    [/^safe-bottom(-stable)?(?:-(\d+))?$/, ([, stable, offset]) => ({
      // transform: `translate3d(0, calc(var(--tg-viewport${stable ? '-stable' : ''}-height, 100vh) - ${offset ?? 16}px - 100vh), 0)`,
      bottom: `${offset ?? 16}px`,
      top: 'unset',
    })],
    [/bg-black-gradient-(\d+)/, ([, deg]) => ({ background: `linear-gradient(${deg}deg, rgba(0,0,0,1) -10%, rgba(0,0,0,0) 95%)` })],
    [/^app-text-(.+?)(-stable)?$/, legacyFontGen],
  ],
  shortcuts: {
    'reset-list': 'm-0 p-0 list-none',
    'w-app': 'w-screen',
    'sortable-drag': 'scale-105 opacity-100! shadow-hover',
    'sortable-ghost': 'opacity-10',
    'ellipsis': 'whitespace-nowrap overflow-hidden text-ellipsis',
  },
  theme: {
    colors: {
      'border': 'var(--border-color)',
      'success': '#89C152 !important',
      'overlay': 'rgba(0, 0, 0, 0.6)',
      'tg_bg': 'var(--tg-theme-bg-color, var(--default-tg-theme-bg-color))',
      'tg_bg_secondary': 'var(--tg-theme-secondary-bg-color, var(--default-tg-theme-secondary-bg-color))',
      'tg_bg_tertiary': 'var(--tg-theme-tertiary-bg-color, var(--default-tg-theme-tertiary-bg-color))',
      'tg_bg_section': 'var(--tg-theme-section-bg-color, var(--default-tg-theme-section-bg-color))',
      'tg_section_text': 'var(--tg-theme-section-header-text-color, var(--default-tg-theme-section-header-text-color))',
      'tg_bg_header': 'var(--tg-theme-header-bg-color, var(--default-tg-theme-header-bg-color))',
      'tg_text': 'var(--tg-theme-text-color, var(--default-tg-theme-text-color))',
      'tg_hint': 'var(--tg-theme-hint-color, var(--default-tg-theme-hint-color))',
      'tg_link': 'var(--tg-theme-link-color, var(--default-tg-theme-link-color))',
      'tg_button': 'var(--tg-theme-button-color, var(--default-tg-theme-button-color))',
      'tg_button_text': 'var(--tg-theme-button-text-color, var(--default-tg-theme-button-text-color))',
      'tg_accent_text': 'var(--tg-theme-accent-text-color, var(--default-tg-theme-accent-text-color))',
      'tg_subtitle_text': 'var(--tg-theme-subtitle-text-color, var(--default-tg-theme-subtitle-text-color))',
      'urgent': 'var(--tg-theme-destructive-text-color, #EF3124)',
    },
  },
  enforce: 'pre',
}));
