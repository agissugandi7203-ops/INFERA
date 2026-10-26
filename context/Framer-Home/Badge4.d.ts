export interface Badge4Props {
  /**
   * Variant
   * Friendly names map to internal IDs:
   *   "Default" → igdoTFQMz
   *   "SM" → Ql_t47bi3
   *   "White" → oBYzv67yH
   */
  variant?: 'Default' | 'SM' | 'White' | 'igdoTFQMz' | 'oBYzv67yH' | 'Ql_t47bi3';
  /**
   * Title — pass as `h3thwb3uh` not `title`.
   * @default "Badge Title"
   */
  h3thwb3uh?: string;
  onh3thwb3uhChange?: string;
  /**
   * Title Color — pass as `rhGiDGRBu` not `titleColor`.
   * @default "var(--token-b923e1cb-cf6e-406c-a3d3-6c79738c4b54, rgb(77, 88, 95))"
   */
  rhGiDGRBu?: string;
  /** Additional properties */
  [key: string]: unknown;
}
