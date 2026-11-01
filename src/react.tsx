/**
 * Nestor for React: the same drawing and controller, as a component. Re-renders only when its
 * size or label change; `state` is applied without re-rendering the drawing. Its states are styled
 * by `nestor.css`, imported once by the page.
 */
import { useEffect, useMemo, useRef } from "react";
import { type ControllerOptions, NestorController } from "./controller.js";
import { type NestorState, renderNestor } from "./render.js";

export interface NestorProps {
  state?: NestorState;
  size?: number | string;
  /** an accessible name; without one it is decorative */
  label?: string;
  className?: string;
  /** a ground shadow under it */
  ground?: boolean;
  /** brings it to life (gaze, blinks, `say`); the controller is handed to `onReady` */
  live?: boolean | ControllerOptions;
  onReady?: (controller: NestorController) => void;
}

export function Nestor({ state = "idle", size = 120, label, className, ground, live, onReady }: NestorProps) {
  const host = useRef<HTMLSpanElement>(null);
  const markup = useMemo(
    () =>
      renderNestor({
        size,
        state: "idle",
        ground: Boolean(ground),
        ...(label ? { label } : {}),
        ...(className ? { className } : {}),
      }),
    [size, label, className, ground],
  );
  const ready = useRef(onReady);
  ready.current = onReady;

  useEffect(() => {
    const svg = host.current?.querySelector("svg");
    if (!svg || !live) return;
    const controller = new NestorController(svg, live === true ? {} : live);
    ready.current?.(controller);
    return () => controller.destroy();
  }, [live]);

  useEffect(() => {
    const svg = host.current?.querySelector("svg");
    if (svg) svg.dataset.state = state;
  }, [state]);

  return (
    <span
      ref={host}
      className="nestor-host"
      style={{ display: "inline-flex", lineHeight: 0 }}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: our own markup, built from constant shapes and escaped attributes
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}
