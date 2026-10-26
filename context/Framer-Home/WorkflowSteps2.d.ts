export interface Workflowsteps2Props {
  /**
   * Variant
   * Friendly names map to internal IDs:
   *   "01 - Phone" → S9bo55EwG
   *   "01" → MOl2VMXXe
   *   "02 - Phone" → HAeavZZvX
   *   "02" → ss6ZomSqu
   *   "03 - Phone" → ZCARy_qTS
   *   "03" → sJ8Z8UD0A
   */
  variant?: '01 - Phone' | '01' | '02 - Phone' | '02' | '03 - Phone' | '03' | 'MOl2VMXXe' | 'ss6ZomSqu' | 'sJ8Z8UD0A' | 'S9bo55EwG' | 'HAeavZZvX' | 'ZCARy_qTS';
  /**
   * 01 Image — pass as `uBpkNBsH_` not `01Image`.
   */
  uBpkNBsH_?: string;
  /**
   * 01 Title — pass as `ZQ4sDRdMd` not `01Title`.
   * @default "Connect your accounts"
   */
  ZQ4sDRdMd?: string;
  onZQ4sDRdMdChange?: string;
  /**
   * 01 Description — pass as `EISrLVa3P` not `01Description`.
   * @default "Securely link your bank, trading, and investment accounts."
   */
  EISrLVa3P?: string;
  onEISrLVa3PChange?: string;
  /**
   * 02 Image — pass as `R3JTbJYVh` not `02Image`.
   */
  R3JTbJYVh?: string;
  /**
   * 02 Title — pass as `R7vsr7Eeu` not `02Title`.
   * @default "Analyze your data"
   */
  R7vsr7Eeu?: string;
  onR7vsr7EeuChange?: string;
  /**
   * 02 Description — pass as `MY8r9rZB6` not `02Description`.
   * @default "AI processes your data to generate clear insights."
   */
  MY8r9rZB6?: string;
  onMY8r9rZB6Change?: string;
  /**
   * 03 Image — pass as `gLEnwvWoT` not `03Image`.
   */
  gLEnwvWoT?: string;
  /**
   * 03 Title — pass as `BvPCACdvF` not `03Title`.
   * @default "Get smart insights"
   */
  BvPCACdvF?: string;
  onBvPCACdvFChange?: string;
  /**
   * 03 Description — pass as `r5DkSureW` not `03Description`.
   * @default "Receive real-time recommendations to optimize your portfolio."
   */
  r5DkSureW?: string;
  onr5DkSureWChange?: string;
  /** Additional properties */
  [key: string]: unknown;
}
