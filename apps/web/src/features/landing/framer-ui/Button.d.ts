export interface ButtonProps {
  /**
   * Variant
   * Friendly names map to internal IDs:
   *   "Dark - Phone" → eFw1AVBfv
   *   "Default - Phone" → OtPPGEvOS
   *   "Dark" → u67hFJtfB
   *   "Default" → CAzYV7KJv
   *   "SM" → yMtQl_Ch0
   */
  variant?: 'Dark - Phone' | 'Default - Phone' | 'Dark' | 'Default' | 'SM' | 'CAzYV7KJv' | 'u67hFJtfB' | 'OtPPGEvOS' | 'eFw1AVBfv' | 'yMtQl_Ch0';
  /**
   * Title — pass as `ziCnPH11n` not `title`.
   * @default "Button Title"
   */
  ziCnPH11n?: string;
  onziCnPH11nChange?: string;
  /**
   * Link — pass as `gayKxTIvB` not `link`.
   */
  gayKxTIvB?: string;
  /**
   * New Tab — pass as `uYcQ8rJi0` not `newTab`.
   * @default false
   */
  uYcQ8rJi0?: boolean;
  onuYcQ8rJi0Change?: string;
  /**
   * Click — pass as `uo_mEDBYl` not `click`.
   */
  uo_mEDBYl?: () => void;
  /** Additional properties */
  [key: string]: unknown;
}
