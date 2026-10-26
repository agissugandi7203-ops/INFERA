export interface Overviewcard14Props {
  /**
   * Variant
   * Friendly names map to internal IDs:
   *   "Desktop" → oQ7_KK9Ry
   *   "Phone" → S7K6hgRTk
   *   "Tablet" → KLt0rpAcj
   */
  variant?: 'Desktop' | 'Phone' | 'Tablet' | 'oQ7_KK9Ry' | 'KLt0rpAcj' | 'S7K6hgRTk';
  /**
   * Icon — pass as `EzLGQv3FE` not `icon`.
   */
  EzLGQv3FE?: string;
  /**
   * Content — pass as `RRYAQG22b` not `content`.
   * @default "All Your Data in One Place Bring all your accounts, assets, and insights together in one clear, unified view."
   */
  RRYAQG22b?: string;
  onRRYAQG22bChange?: string;
  /** Additional properties */
  [key: string]: unknown;
}
