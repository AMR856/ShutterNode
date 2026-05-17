interface ResizeOptions {
  width?: number;
  height?: number;

  crop?: "fill" | "fit" | "limit" | "pad" | "scale" | "thumb";

  gravity?:
    | "auto"
    | "face"
    | "faces"
    | "center"
    | "north"
    | "south"
    | "east"
    | "west"
    | "north_east"
    | "north_west"
    | "south_east"
    | "south_west";
  zoom?: number;
}

interface AdjustmentOptions {
  brightness?: number;
  contrast?: number;
  saturation?: number;
  hue?: number;
  vibrance?: number;
  gamma?: number;
  sharpen?: number;
  unsharpMask?: number;
}

interface FilterOptions {
  grayscale?: boolean;
  sepia?: boolean;
  blur?: number;
  pixelate?: number;
  vignette?: number;
  oilPaint?: number;
  cartoonify?: boolean | number;
  negate?: boolean;

  /**
   * Artistic style filter.
   * Options: al_dente, athena, audrey, aurora, daguerre, eucalyptus,
   *          fes, frost, hairspray, hokusai, incognito, linen, peacock,
   *          primavera, quartz, red_rock, refresh, sizzle, sonnet, ukulele, zorro
   */
  art?: string;
}

interface WatermarkOptions {
  text: string;
  fontFamily?: string;
  fontSize?: number;
  fontColor?: string;
  gravity?:
    | "center"
    | "north"
    | "south"
    | "east"
    | "west"
    | "north_east"
    | "north_west"
    | "south_east"
    | "south_west";
  opacity?: number;
  x?: number;
  y?: number;
}

interface BorderOptions {
  width: number;
  color: string;
}

export interface TransformationOptions {
  resize?: ResizeOptions;
  rotate?: number;
  flip?: "horizontal" | "vertical" | "both";
  format?: "jpg" | "png" | "webp" | "avif" | "gif" | "auto";

  fetchFormat?: "auto";

  quality?: number | "auto";
  dpr?: number;
  adjustments?: AdjustmentOptions;
  filters?: FilterOptions;
  watermark?: WatermarkOptions;
  border?: BorderOptions;

  radius?: number | "max";

  background?: string;
}
