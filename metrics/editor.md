# Editor Metrics

## Purpose

Lightweight metrics used to validate early architectural decisions in the editor core.
Metrics are sampled per animation frame and are intended for sanity-checking, not benchmarking.

---

## Input & Rendering

### Events per frame (`eventsProcessed`)

- **Observation:**  
  Pointer and keyboard input can generate many events between animation frames.

- **Metric:**  
  `eventsProcessed` - number of editor events reduced in a single frame.

- **Target:**  
  Multiple events per frame during interaction; render frequency remains aligned with the browser frame rate.

- **Result:**  
  Event batching reduces unnecessary renders while preserving interaction fidelity.

---

### Render cost (`lastRenderMs`, `shapeCount`)

- **Observation:**  
  The editor performs a full canvas redraw each frame.

- **Metrics:**  
  - `lastRenderMs` - time spent rendering the canvas  
  - `shapeCount` - number of rendered shapes

- **Target:**  
  Render time remains comfortably under the frame budget at current shape counts.

- **Result:**  
  Full redraw rendering is acceptable for the current scope.

---

## Interaction Modeling

### Mode transitions

- **Observation:**  
  Pointer interactions move through explicit modes (`idle`, `armed`, `dragging`, `drawing`).

- **Target:**  
  No invalid transitions or stuck interaction states.

- **Result:**  
  Interaction behavior is predictable and cancellation behaves correctly.

---

### Hit-testing (`hitTests`, `shapeCount`)

- **Observation:**  
  Hit-testing is performed on pointer down (intent resolution) and on pointer move while idle (hover).
  Drag interactions do not perform hit-testing.

- **Metrics:**  
  - `hitTests` - number of hit-tests performed per frame  
  - `shapeCount` - number of shapes scanned during hit-testing

- **Target:**  
  Linear hit-testing remains cheap at current shape counts and does not impact frame time.

- **Result:**  
  No hit-testing related performance issues observed.

---

