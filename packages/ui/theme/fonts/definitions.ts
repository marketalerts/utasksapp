import type { FontClass, ModifierRecord } from './helpers';
import { font } from './helpers';

export const fontClassifiers = {
  'headline-l': font(32, 40),
  'headline-m': font(28, 36),
  'headline-s': font(24, 30),

  'title-l': font(22, 28),
  'title-m': font(20, 24),
  'title-s': font(18, 22),

  'body-l': font(16, 20),
  'body-m': font(14, 18),
  'body-s': font(12, 16),

  'caption-l': font(12, 16),
  'caption-m': font(11, 16),
  'caption-s': font(10, 16),
} satisfies Record<string, FontClass>;

export const fontModifiers = {
  'regular': [400],
  'regular-long': [400, f => ({ lineHeight: f.lineHeight + 2 })],
  'medium': [510],
  'semibold': [590, f => ({ lineHeight: f.lineHeight - 2 })],
} satisfies Record<string, ModifierRecord>;
