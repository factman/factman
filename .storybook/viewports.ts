import type { ViewportMap } from 'storybook/viewport';

/**
 * The three design widths of the canvas (ETE-82, docs/interaction-and-motion.md): phone 390,
 * tablet 768, desktop 1440. Heights are a common screen of that width. The Playwright tests use the
 * same three widths.
 */
export const FM_VIEWPORTS = {
  mobile: { name: 'Mobile 390', styles: { width: '390px', height: '844px' }, type: 'mobile' },
  tablet: { name: 'Tablet 768', styles: { width: '768px', height: '1024px' }, type: 'tablet' },
  desktop: { name: 'Desktop 1440', styles: { width: '1440px', height: '900px' }, type: 'desktop' },
} satisfies ViewportMap;
