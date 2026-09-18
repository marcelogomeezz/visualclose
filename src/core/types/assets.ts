/** A reference to an image asset. `url` kind assets are static files; `blob` kind assets live in IndexedDB. */
export interface AssetRef {
  id: string;
  kind: "url" | "blob";
  /** Resolvable URL (static path or object URL created on hydration). */
  url: string;
  name: string;
  mime: string;
  width?: number;
  height?: number;
}

export interface NormalizedPoint {
  /** 0..1 across the source image, left → right */
  x: number;
  /** 0..1 across the source image, top → bottom */
  y: number;
}
