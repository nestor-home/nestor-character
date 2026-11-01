import { describe, expect, it } from "vitest";
import { ease, gazeToward, speakingTime } from "../src/controller.js";
import { renderNestor, renderNestorStill, STATES } from "../src/render.js";

describe("the character's drawing", () => {
  it("names its parts, so states can be styled", () => {
    const svg = renderNestor({ state: "thinking" });
    for (const part of ["nestor-tuft", "nestor-skin", "nestor-bow", "nestor-eyes", "nestor-mouth", "nestor-thoughts"]) {
      expect(svg).toContain(part);
    }
    expect(svg).toContain('data-state="thinking"');
  });

  it("is decorative without a label, and named with one", () => {
    expect(renderNestor()).toContain('aria-hidden="true"');
    expect(renderNestor({ label: "Nestor" })).toContain('role="img" aria-label="Nestor"');
  });

  it("drops its small details at icon sizes", () => {
    expect(renderNestor({ size: 16 })).not.toContain("nestor-bow");
    expect(renderNestor({ size: 16 })).toContain("nestor--tiny");
    expect(renderNestorStill(16)).not.toContain("stroke-opacity");
  });

  it("escapes what it is given", () => {
    expect(renderNestor({ label: 'a"b<c' })).toContain('aria-label="a&quot;b&lt;c"');
    expect(renderNestor({ attributes: { "on click": "x", "data-x": '"' } })).not.toContain("on click");
  });

  it("knows nine states", () => {
    expect(STATES).toHaveLength(9);
  });

  it("draws spiral eyes for when it is dizzy, hidden in every other state", () => {
    const svg = renderNestor({ state: "dizzy" });
    expect(svg).toContain('data-state="dizzy"');
    expect(svg).toMatch(/<g class="nestor-dizzy">(<path d="M[^"]+L[^"]+"\/>){2}<\/g>/);
  });
});

describe("the character's gaze", () => {
  it("looks toward the point, within its limits", () => {
    const right = gazeToward({ x: 2000, y: 100 }, { x: 100, y: 100 }, 400);
    expect(right.gx).toBeCloseTo(5);
    expect(right.turn).toBeGreaterThan(0);
    const left = gazeToward({ x: 0, y: 100 }, { x: 100, y: 100 }, 400);
    expect(left.gx).toBeLessThan(0);
    const ahead = gazeToward({ x: 100, y: 100 }, { x: 100, y: 100 });
    expect(ahead.gx).toBe(0);
    expect(ahead.gy).toBe(0);
  });

  it("eases toward its target at the same pace whatever the frame rate", () => {
    let fast = 0;
    for (let i = 0; i < 6; i++) fast = ease(fast, 10, 16);
    const slow = ease(ease(0, 10, 48), 10, 48);
    expect(fast).toBeCloseTo(slow, 5);
    expect(ease(0, 10, 90)).toBeCloseTo(5, 5);
  });

  it("speaks long enough to read a line, and not forever", () => {
    expect(speakingTime("On it.")).toBeLessThan(speakingTime("A much longer sentence to read aloud."));
    expect(speakingTime("x".repeat(1000))).toBe(6000);
  });
});
