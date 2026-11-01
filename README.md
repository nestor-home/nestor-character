# @nestor-home/character

Nestor's character, the one face of the [Nestor](https://github.com/nestor-home/nestor) home
assistant on every screen: an ink pebble with a quiff, two paper eyes, an ember cursor for a mouth
and a small bow tie. It comes as SVG markup any page can inline, nine states in CSS, a small
controller that brings it to life, a React component, the logo and the Bayer dither around it.

## Install

```bash
pnpm add @nestor-home/character
```

ESM only. React (18 or later) is needed only for `@nestor-home/character/react`.

## Without a framework

```ts
import "@nestor-home/character/nestor.css";
import { NestorController, renderNestor } from "@nestor-home/character";

host.innerHTML = renderNestor({ state: "idle", size: 120, label: "Nestor" });
const nestor = new NestorController(host.querySelector("svg")!, { saccades: true });
nestor.lookAt(event.clientX, event.clientY);
nestor.state = "thinking";
```

States: `idle`, `listening`, `thinking`, `speaking`, `laughing`, `sleeping`, `working`,
`concerned`, `dizzy` (spiral eyes; under reduced motion they stay still). Colours follow the page's `--ink`, `--paper` and `--ember` custom properties. The
controller pauses off screen and when the tab is hidden, and holds a static pose under
`prefers-reduced-motion`.

Also exported: `renderLogo()` (the wordmark and its bow tie), `renderBowTie()`,
`renderMarkStill()` (the monogram, for icons), `renderNestorStill()` (written colours, for favicons
and sharing images), `drawDither(canvas)` and `ditherSvg()` (the texture), and `geometry` (the shapes
as data).

## React

```tsx
import "@nestor-home/character/nestor.css";
import { Nestor } from "@nestor-home/character/react";

<Nestor state="speaking" size={96} label="Nestor" live onReady={(nestor) => nestor.say("On it.")} />;
```

## Develop

```bash
pnpm install
pnpm lint && pnpm typecheck && pnpm test && pnpm package:check
```

## License

[MIT](LICENSE)
