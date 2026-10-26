export interface Blurgradientprod2Props {
  /**
   * Blur
   * Range: min: 0, max: 100, step: 1
   * @default 10
   */
  blur?: number;
  /**
   * Radius — pass as `borderRadius` not `radius`.
   * @default "0px"
   */
  borderRadius?: string;
  /**
   * Direction
   * Options: "toBottom" | "toTop" | "toLeft" | "toRight"
   * @default "toBottom"
   */
  direction?: string;
  /** Additional properties */
  [key: string]: unknown;
}
