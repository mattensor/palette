# Editor Metrics

## Purpose

Lightweight metrics used to validate early architectural decisions in the editor core.  
Metrics are sampled per animation frame and are intended for sanity-checking, not benchmarking.

---

## Input & Rendering

### Event batching (`queueLength`, `movesDropped`, `movesKept`)

- **Observation:**  
  Pointer and keyboard input can generate many events between animation frames, and pointer-move events can dominate the queue during interaction.

- **Metrics:**  
  - `queueLength` — raw number of input events enqueued since the previous frame  
  - `movesDropped` — number of pointer-move events discarded by coalescing  
  - `movesKept` — number of pointer-move events retained by coalescing

- **Target:**  
  During active pointer interaction, `queueLength` may grow, while coalescing ensures that the number of events actually reduced per frame remains bounded and rendering stays aligned with the browser frame rate.

- **Result:**  
  Coalescing reduces unnecessary reducer work and avoids excessive renders while preserving interaction fidelity.

---

### Frame and render cost (`frameMsAvg`, `lastRenderMs`, `shapeCount`)

- **Observation:**  
  The editor performs a full canvas redraw each frame; overall responsiveness depends on the combined cost of event reduction, hit-testing (when applicable), and rendering.

- **Metrics:**  
  - `frameMsAvg` — exponential moving average of total frame processing time  
  - `lastRenderMs` — time spent rendering the canvas (single frame)  
  - `shapeCount` — number of rendered shapes

- **Target:**  
  `frameMsAvg` remains comfortably under the frame budget at current `shapeCount`, and `lastRenderMs` stays low enough that non-render work does not cause jank.

- **Result:**  
  Full redraw rendering is acceptable for the current scope, and frame-time smoothing provides a stable signal for regressions.

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

### Hit-testing cost (`hitTests`, `hitTestMsLast`, `shapeCount`)

- **Observation:**  
  Hit-testing is performed on pointer down (intent resolution) and on pointer move while idle (hover).  
  Drag interactions do not perform hit-testing.

- **Metrics:**  
  - `hitTests` — number of hit-tests performed per frame  
  - `hitTestMsLast` — time spent in the most recent hit-test  
  - `shapeCount` — number of shapes rendered (and an upper bound on scan work)

- **Target:**  
  Hit-testing remains cheap at current `shapeCount` and does not materially affect `frameMsAvg`.  
  `hitTestMsLast` should stay low and scale roughly linearly with shape count.

- **Result:**  
  No hit-testing related performance issues observed; timing visibility helps isolate regressions when hover or selection begins to cost more than expected.

---

## Undo / Redo

### History depth (`historyDepth`)

- **Observation:**  
  Undo / redo correctness depends on the editor committing semantic user actions rather than mechanical state changes.

- **Metric:**  
  `historyDepth` — number of committed, undoable editor states.

- **Target:**  
  History depth increases only on semantic commits (e.g. completed drags, discrete commands) and never decreases below the root state.

- **Result:**  
  History depth correlates with user intent, redo invalidation behaves correctly, and multi-step interactions are batched into single undoable actions.
