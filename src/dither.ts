/**
 * Nestor's signature texture: an ordered (Bayer 8×8) dither in the current text colour, with
 * square dots aligned to device pixels so it stays crisp at every density.
 */
export const BAYER = [
  [0, 32, 8, 40, 2, 34, 10, 42],
  [48, 16, 56, 24, 50, 18, 58, 26],
  [12, 44, 4, 36, 14, 46, 6, 38],
  [60, 28, 52, 20, 62, 30, 54, 22],
  [3, 35, 11, 43, 1, 33, 9, 41],
  [51, 19, 59, 27, 49, 17, 57, 25],
  [15, 47, 7, 39, 13, 45, 5, 37],
  [63, 31, 55, 23, 61, 29, 53, 21],
] as const;

export type DitherShape = "ramp-right" | "ramp-left" | "ramp-down" | "ramp-up" | "field" | "vignette" | "horizon";

/** Density in [0, 1] of the texture at (u, v) in [0, 1]², ramping from `from` to `to`. */
export function density(shape: DitherShape, u: number, v: number, from: number, to: number): number {
  const mix = (t: number) => from + (to - from) * t;
  switch (shape) {
    case "ramp-right":
      return mix(u);
    case "ramp-left":
      return mix(1 - u);
    case "ramp-down":
      return mix(v);
    case "ramp-up":
      return mix(1 - v);
    case "vignette":
      return mix(Math.min(1, Math.hypot(u - 0.5, v - 0.5) * 2));
    case "horizon":
      // dense at the bottom, thinning upward, a little denser at the edges
      return mix(Math.min(1, v ** 1.6 * (0.75 + 0.5 * Math.abs(u - 0.5))));
    default:
      return from;
  }
}

/** Whether the dot at column x, row y of a cols × rows grid is drawn. */
export function lit(shape: DitherShape, x: number, y: number, cols: number, rows: number, from: number, to: number) {
  const row = BAYER[y % 8] as readonly number[];
  const threshold = ((row[x % 8] as number) + 0.5) / 64;
  return density(shape, x / Math.max(1, cols - 1), y / Math.max(1, rows - 1), from, to) > threshold;
}

/** Draws the texture on a canvas sized by CSS, in its computed text colour. */
export function drawDither(canvas: HTMLCanvasElement): void {
  const context = canvas.getContext("2d");
  if (!context) return;
  const shape = (canvas.dataset.shape ?? "ramp-right") as DitherShape;
  const from = Number(canvas.dataset.from ?? 0);
  const to = Number(canvas.dataset.to ?? 0.6);
  const dot = Number(canvas.dataset.dot ?? 2);
  const ratio = window.devicePixelRatio || 1;
  const cell = Math.max(1, Math.round(dot * ratio));
  const { width, height } = canvas.getBoundingClientRect();
  if (!width || !height) return;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = getComputedStyle(canvas).color;
  const cols = Math.ceil(canvas.width / cell);
  const rows = Math.ceil(canvas.height / cell);
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (lit(shape, x, y, cols, rows, from, to)) context.fillRect(x * cell, y * cell, cell, cell);
    }
  }
}

/** How full the breathing texture is at `seconds`: from 0.7 to 1 of its density and back, every `period`. */
export function breathing(seconds: number, period = 2.4): number {
  return 0.85 + 0.15 * Math.sin((seconds * 2 * Math.PI) / period);
}

export interface BreathingOptions {
  /** seconds for one breath (default 2.4) */
  period?: number;
  /** milliseconds between frames (default 80: about twelve a second, plenty for dots) */
  frame?: number;
}

/**
 * The texture breathing on its canvas: its density swells and ebbs around the `data-from` and
 * `data-to` it was given, so dots light up and go out across it. Drawn once and left still under
 * `prefers-reduced-motion`; paused while the canvas is off screen or the tab hidden. Returns the
 * function that stops it.
 */
export function animateDither(
  canvas: HTMLCanvasElement,
  { period = 2.4, frame = 80 }: BreathingOptions = {},
): () => void {
  const from = Number(canvas.dataset.from ?? 0);
  const to = Number(canvas.dataset.to ?? 0.6);
  drawDither(canvas);
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return () => {};
  let visible = true;
  const seen = new IntersectionObserver(([entry]) => {
    visible = entry?.isIntersecting ?? true;
  });
  seen.observe(canvas);
  let last = 0;
  let request = 0;
  const tick = (now: number) => {
    request = requestAnimationFrame(tick);
    if (!visible || now - last < frame) return;
    last = now;
    const swell = breathing(now / 1000, period);
    canvas.dataset.from = String(from * swell);
    canvas.dataset.to = String(to * swell);
    drawDither(canvas);
  };
  request = requestAnimationFrame(tick);
  return () => {
    cancelAnimationFrame(request);
    seen.disconnect();
    canvas.dataset.from = String(from);
    canvas.dataset.to = String(to);
  };
}

/** The same texture as an SVG string (for the Open Graph images, drawn without a canvas). */
export function ditherSvg(
  shape: DitherShape,
  width: number,
  height: number,
  dot: number,
  colour: string,
  from: number,
  to: number,
): string {
  const cols = Math.ceil(width / dot);
  const rows = Math.ceil(height / dot);
  let rects = "";
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      if (lit(shape, x, y, cols, rows, from, to))
        rects += `<rect x="${x * dot}" y="${y * dot}" width="${dot}" height="${dot}"/>`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" shape-rendering="crispEdges"><g fill="${colour}">${rects}</g></svg>`;
}
