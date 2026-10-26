export interface Pretitle64Props {
  /**
   * Variant
   * Friendly names map to internal IDs:
   *   "Dark" → GyM4q7LNO
   *   "Default" → dVqc43eR9
   *   "White" → uyNLry1D8
   */
  variant?: 'Dark' | 'Default' | 'White' | 'dVqc43eR9' | 'uyNLry1D8' | 'GyM4q7LNO';
  /**
   * Title — pass as `BSyxhptbW` not `title`.
   * @default "Subscription plans"
   */
  BSyxhptbW?: string;
  onBSyxhptbWChange?: string;
  /** Additional properties */
  [key: string]: unknown;
}
