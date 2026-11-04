import { afterEach, describe, expect, it, vi } from "vitest";
import { animateDither, breathing, density, lit } from "../src/dither.js";

describe("the dither", () => {
  it("lights about as many dots as the density asks", () => {
    for (const d of [0.1, 0.25, 0.5, 0.8]) {
      let on = 0;
      for (let y = 0; y < 64; y++) for (let x = 0; x < 64; x++) if (lit("field", x, y, 64, 64, d, d)) on++;
      expect(on / 4096).toBeCloseTo(d, 1);
    }
  });

  it("ramps from one side to the other", () => {
    expect(density("ramp-right", 0, 0.5, 0, 1)).toBe(0);
    expect(density("ramp-right", 1, 0.5, 0, 1)).toBe(1);
    expect(density("horizon", 0.5, 0, 0, 1)).toBeLessThan(density("horizon", 0.5, 1, 0, 1));
  });
});

describe("the breathing dither", () => {
  it("swells and ebbs between 70 % and all of its density", () => {
    const seen = Array.from({ length: 100 }, (_, i) => breathing(i / 10));
    expect(Math.min(...seen)).toBeCloseTo(0.7, 2);
    expect(Math.max(...seen)).toBeCloseTo(1, 2);
    expect(breathing(0)).toBe(breathing(2.4));
  });

  /** A canvas and a browser clock the test drives: `run(ms)` plays frames up to that time. */
  function browser({ reduced = false } = {}) {
    let frames: [number, FrameRequestCallback][] = [];
    let next = 1;
    const canvas = { dataset: { from: "0", to: "0.6" }, getContext: () => null } as unknown as HTMLCanvasElement;
    const watching: string[] = [];
    vi.stubGlobal("matchMedia", () => ({ matches: reduced }));
    vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
      frames.push([next, callback]);
      return next++;
    });
    vi.stubGlobal("cancelAnimationFrame", (id: number) => {
      frames = frames.filter(([key]) => key !== id);
    });
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        observe() {
          watching.push("observe");
        }
        disconnect() {
          watching.push("disconnect");
        }
      },
    );
    const run = (until: number, step = 20) => {
      for (let now = 0; now <= until; now += step) {
        const due = frames;
        frames = [];
        for (const [, callback] of due) callback(now);
      }
    };
    return { canvas, run, watching, pending: () => frames.length };
  }

  afterEach(() => vi.unstubAllGlobals());

  it("breathes around the density it was given, then stops where it started", () => {
    const { canvas, run, watching, pending } = browser();
    const stop = animateDither(canvas);
    run(1_200);
    expect(Number(canvas.dataset.to)).toBeGreaterThan(0.6 * 0.69);
    expect(Number(canvas.dataset.to)).toBeLessThanOrEqual(0.6);
    expect(canvas.dataset.to).not.toBe("0.6");
    stop();
    expect(canvas.dataset).toEqual({ from: "0", to: "0.6" });
    expect(pending()).toBe(0);
    expect(watching).toEqual(["observe", "disconnect"]);
  });

  it("stays still for a reader who asked for less motion", () => {
    const { canvas, run, pending } = browser({ reduced: true });
    animateDither(canvas);
    run(1_200);
    expect(canvas.dataset.to).toBe("0.6");
    expect(pending()).toBe(0);
  });
});
