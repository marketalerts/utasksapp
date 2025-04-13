import { defineConfig } from 'unocss/vite';

import theme from 'ui/theme';

export default defineConfig({
  presets: [theme],
  safelist: ['sortable-drag', 'sortable-ghost'],
});