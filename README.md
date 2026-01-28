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

- pointer input normalization (browser → domain events)
- deterministic state updates (event → reducer → next state)
- frame-aware rendering via requestAnimationFrame
- clear separation between runtime interaction state and document state

It is **not**:

- a finished product
- a UI-heavy design exercise
- a collection of React patterns

---

## Architecture overview

The editor is split into a few layers:

[ App / Layout ]
AppShell, Sidebar, Editor

[ Host / Adapter ]
CanvasHost (event normalization + rAF scheduling)

[ Editor Core (headless) ]
EditorState, Reducer, Effects, DocReducer, Renderer


Key ideas:

- The editor core does not depend on React or the DOM
- CanvasHost adapts browser input + scheduling to the editor
- Rendering is a pure read of editor state
- Document changes are applied via explicit DocEffects

---

## Current scope

Right now, the editor supports:

- normalized pointer + keyboard events (`EditorEvent`)
- event batching and rendering via `requestAnimationFrame`
- shape drawing (rectangle preview while drawing, commit on pointer up)
- hit-testing + hover state
- selection (single shape)
- dragging selected shapes (anchored drag model)
- deleting the selected shape via keyboard

In progress / next:

- undo / redo (patch-based history)
- coalescing drag into a single committed history entry
- persistence
- performance profiling + batching refinements

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

## Status

Actively in progress and intentionally incomplete.

Each phase focuses on one concern at a time:
- correctness first
- structure second
- polish last
