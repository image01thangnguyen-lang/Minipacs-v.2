import { MiniPacsSeriesItem } from '../types/series';

export type MiniPacsLayoutRule = {
  id: string;
  predicate: (items: MiniPacsSeriesItem[]) => boolean;
  layout: { numRows: number; numCols: number };
  description: string;
};

/**
 * Conservative layout rules for Phase 4.
 * These describe preferred layouts per modality but do NOT auto-switch.
 * The rail and UI should consult these rules when the user explicitly
 * requests a layout suggestion (Phase 4.1+).
 */
export const seriesLayoutRules: MiniPacsLayoutRule[] = [
  {
    id: 'dx-cr-single',
    predicate: items => {
      const imageItems = items.filter(i => !i.isUnsupported);
      return imageItems.length === 1 && ['DX', 'CR'].includes(imageItems[0].Modality || '');
    },
    layout: { numRows: 1, numCols: 1 },
    description: 'DX/CR single image: 1×1',
  },
  {
    id: 'us-single',
    predicate: items => {
      const imageItems = items.filter(i => !i.isUnsupported);
      return imageItems.length === 1 && imageItems[0].Modality === 'US';
    },
    layout: { numRows: 1, numCols: 1 },
    description: 'US single series: 1×1',
  },
  {
    id: 'us-multi',
    predicate: items => {
      const usItems = items.filter(i => !i.isUnsupported && i.Modality === 'US');
      return usItems.length >= 2;
    },
    layout: { numRows: 1, numCols: 2 },
    description: 'US two or more series: suggest 1×2 (user must confirm)',
  },
  {
    id: 'ct-mr-stack',
    predicate: items => {
      const imageItems = items.filter(i => !i.isUnsupported);
      return (
        imageItems.length >= 1 &&
        imageItems.every(i => ['CT', 'MR'].includes(i.Modality || ''))
      );
    },
    layout: { numRows: 1, numCols: 1 },
    description: 'CT/MR stack: 1×1',
  },
];

/**
 * Returns a suggested layout for the given series items, or null if no rule matches.
 * Phase 4 does NOT auto-apply these — they are advisory only.
 */
export function determineOptimalLayout(
  items: MiniPacsSeriesItem[]
): { numRows: number; numCols: number } | null {
  for (const rule of seriesLayoutRules) {
    if (rule.predicate(items)) {
      return rule.layout;
    }
  }
  return null;
}
