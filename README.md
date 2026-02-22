# Palette

Palette is a canvas-based editor inspired by tools like Canva and Figma.

I’m building it to explore the architecture and performance challenges behind interaction-heavy web applications. The focus is on how an editor behaves under real constraints like continuous pointer input, evolving document state, undo/redo history, and smooth rendering.

This is about building a system that behaves like a real editor, not a visual demo.

---

## Why

Modern design tools need to handle complex interactions while keeping state predictable and performance smooth.

This project explores how to structure a browser-based editor for:

- predictable state updates under high-frequency input
- clear separation between interaction state and document state
- frame-aware rendering using `requestAnimationFrame`
- local-first persistence and recovery
- an architecture that is independent of any UI framework

The goal is to understand the tradeoffs behind real editor systems and build something that holds up under pressure.

---

## Focus areas

- Pointer input normalization (browser to domain events)
- Deterministic state transitions (event → reducer → state)
- Rendering boundaries and frame control
- Separating editor core from UI framework
- Explicit document mutations via effects
- Performance during continuous interaction

---

## Architecture

The editor is split into three layers.

**App / Layout**  
React components and application shell.

**Host / Adapter**  
`CanvasHost` converts browser input into domain events and schedules rendering using `requestAnimationFrame`.

**Editor Core (headless)**  
State, reducers, effects, and rendering logic that do not depend on React or the DOM.

### Principles

- The editor core is framework-independent  
- Browser input becomes domain-level events  
- Rendering is a pure read of editor state  
- Interaction state and document state are separate  
- Document changes happen through explicit effects  

---

## Current capabilities

### Interaction
- Rectangle drawing with preview and commit
- Hit testing and hover state
- Single selection
- Anchored drag model for moving shapes
- Drag coalesced into a single history entry

### State and history
- Reducer-based deterministic state updates
- Undo / redo using patch-based history

### Persistence
- Local-first persistence with automatic recovery

### Performance
- Normalized pointer and keyboard events
- Event batching with `requestAnimationFrame`
- Controlled rendering boundaries to avoid unnecessary React work
- Basic performance profiling and batching improvements

---

## Future exploration

- Multi-selection and grouping
- Handling large documents (1000+ elements)
- Canvas vs hybrid rendering strategies
- Real-time collaboration experiments

---

## Tech stack

- React
- TypeScript
- Vite
- Canvas 2D

No external state libraries.

---

## Running locally

```bash
npm install
npm run dev
