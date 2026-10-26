export interface Statlgcard24Props {
  /**
   * Variant
   * Friendly names map to internal IDs:
   *   "Dark - Phone" → E2kjGBypG
   *   "Default - Phone " → ovN7hMSC0
   *   "Primary - Phone" → fdFmWW5Sj
   *   "White - Phone" → WR8MzyEPU
   *   "Dark" → qxuYd46p_
   *   "Default" → j9hJSBouZ
   *   "Primary" → LAVyIFDuD
   *   "White" → dD9vhUivF
   */
  variant?: 'Dark - Phone' | 'Default - Phone ' | 'Primary - Phone' | 'White - Phone' | 'Dark' | 'Default' | 'Primary' | 'White' | 'j9hJSBouZ' | 'qxuYd46p_' | 'LAVyIFDuD' | 'dD9vhUivF' | 'ovN7hMSC0' | 'E2kjGBypG' | 'fdFmWW5Sj' | 'WR8MzyEPU';
  /**
   * Pre Title — pass as `V1x3EoHFX` not `preTitle`.
   * @default "Active investors"
   */
  V1x3EoHFX?: string;
  onV1x3EoHFXChange?: string;
  /**
   * Icon — pass as `XZfwo1a6Z` not `icon`.
   */
  XZfwo1a6Z?: string;
  /**
   * Title — pass as `NDcYsg5oi` not `title`.
   * @default "10,000+"
   */
  NDcYsg5oi?: string;
  onNDcYsg5oiChange?: string;
  /**
   * Description — pass as `t_H7Fx64z` not `description`.
   * @default "Users managing portfolios with AI insights."
   */
  t_H7Fx64z?: string;
  ont_H7Fx64zChange?: string;
  /** Additional properties */
  [key: string]: unknown;
}
