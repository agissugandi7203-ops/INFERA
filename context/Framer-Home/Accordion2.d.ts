export interface Accordion2Props {
  /**
   * Variant
   * Friendly names map to internal IDs:
   *   "Close - Phone" → ciPb55D8c
   *   "Open - Phone" → I6yIM5iJA
   *   "White Close - Phone" → irH83JwdM
   *   "White Close" → gY6mqXOpW
   *   "White Open- Phone" → CPe0_evTA
   *   "White Open" → X4L6HtqcM
   *   "Close" → Z3V2APvoq
   *   "Open" → zSlT2gi2H
   */
  variant?: 'Close - Phone' | 'Open - Phone' | 'White Close - Phone' | 'White Close' | 'White Open- Phone' | 'White Open' | 'Close' | 'Open' | 'Z3V2APvoq' | 'zSlT2gi2H' | 'gY6mqXOpW' | 'X4L6HtqcM' | 'ciPb55D8c' | 'I6yIM5iJA' | 'irH83JwdM' | 'CPe0_evTA';
  /**
   * Question — pass as `Cem09IVM0` not `question`.
   * @default "How many habits can I track?"
   */
  Cem09IVM0?: string;
  onCem09IVM0Change?: string;
  /**
   * Answer — pass as `NV3c2dGIv` not `answer`.
   * @default "You can track as many as you want, but most users keep 5–8 habits for better consistency."
   */
  NV3c2dGIv?: string;
  onNV3c2dGIvChange?: string;
  /** Additional properties */
  [key: string]: unknown;
}
