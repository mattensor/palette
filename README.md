# Palette

Palette is a canvas-based editor I’m building to practice **frontend system design**, not UI polish.

The focus of this project is on:

- input handling
- state modeling
- rendering boundaries
- performance constraints

I’m deliberately treating this like an internal editor system rather than a demo app.

---

## What this project is (and isn’t)

This project is about **how an editor works**, not how it looks.

I’m using it to explore:

- pointer input normalization
- deterministic state updates
- frame-aware rendering
- clear separation between DOM, logic, and rendering

It is **not**:

- a finished product
- a UI-heavy design exercise
- a collection of React patterns

---

## Architecture overview

The editor is split into a few clear layers:

```
[ App / Layout ]
  AppShell, Sidebar, Editor

[ DOM Adapter ]
  CanvasHost

[ Editor Core (headless) ]
  EditorState, Reducer, Renderer
```

Key ideas:

- The editor core does not depend on React or the DOM
- CanvasHost adapts browser input and scheduling to the editor
- Rendering is a pure read of editor state
- Layout decisions don’t leak into editor logic

---

## Component hierarchy

```
Root (#root)
└── App
    └── AppShell
        ├── Sidebar
        └── Editor
            └── CanvasHost
                └── CanvasSurface
```

Each component has a single responsibility and minimal knowledge of the others.

---

## Current scope

Right now, the editor supports:

- pointer-driven drawing
- normalized pointer events
- a single source of truth for editor state
- rendering batched with \`requestAnimationFrame\`
- a stable, full-viewport canvas layout

Things that are intentionally **not** implemented yet:

- selection
- undo / redo
- zoom / pan
- persistence
- performance optimizations
- tooling UI

Those will be added later, once the foundations are solid.

---

## Tech stack

- React
- TypeScript
- Vite
- Canvas 2D

No state libraries.  
No rendering frameworks.  
No styling systems.

---

## Running locally

```bash
npm install
npm run dev
```

---

## How I’m approaching this

A few rules I’m following while building this:

- Build the simplest thing that’s correct
- Keep boundaries explicit
- Prefer boring code over clever code
- Don’t optimize until there’s something to optimize
- Treat architecture decisions as part of the output

This repo is meant to show **how I think about frontend systems**, not just what I can ship quickly.

---

## Status

This project is actively in progress and intentionally incomplete.

Each phase focuses on one concern at a time:

- correctness first
- structure second
- polish last
