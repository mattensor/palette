# Editor Metrics

## Purpose

Lightweight, frame-scoped metrics used to **validate architectural decisions** in the editor core.

These metrics are **diagnostic signals**, not benchmarks.  
They exist to surface regressions, scaling risks, and incorrect interaction modeling during development—not to drive premature optimization.

Metrics are sampled once per animation frame.

---

## Frame Health

### Frame timing (`frameMsLast`, `frameMsAvg`, `lastRenderMs`)

**Observation**  
The editor performs a full canvas redraw per animation frame. Overall responsiveness depends on the combined cost of:
- event reduction
- interaction advancement
- rendering

**Metrics**
- `frameMsLast` — total processing time for the most recent frame
- `frameMsAvg` — exponential moving average of frame processing time
- `lastRenderMs` — time spent rendering the canvas in the most recent frame

**Target**
- `frameMsAvg` remains comfortably under the frame budget
- `lastRenderMs` remains a minority of total frame cost
- spikes in `frameMsLast` are explainable via interaction state or shape count

**Result**  
Full redraw rendering is acceptable at current scale. Frame-level aggregation provides a stable, low-noise signal for detecting performance regressions.

---

## Input Pressure

### Event batching (`queueLength`, `movesDropped`)

**Observation**  
Pointer and keyboard input can generate many events between animation frames, with pointer-move events dominating during active interaction.

**Metrics**
- `queueLength` — number of raw input events queued since the previous frame
- `movesDropped` — number of pointer-move events discarded by coalescing

**Target**
- During active pointer interaction:
  - `queueLength` may grow transiently
  - `movesDropped` increases as redundant pointer moves are collapsed
  - reducer and render work remains bounded to one frame’s worth of state advancement

**Result**  
Input coalescing reduces unnecessary reducer work and prevents excessive renders while preserving interaction fidelity.

---

## Scale Signals

### Hit-testing and shape count (`shapeCount`, `hitTestsThisFrame`)

**Observation**  
Hit-testing is performed:
- on pointer down (intent resolution)
- on pointer move while idle (hover detection)

Hit-testing is **not** performed during active dragging or drawing.

**Metrics**
- `shapeCount` — number of shapes in the document (upper bound on scan work)
- `hitTestsThisFrame` — number of hit-tests performed during the current frame

**Target**
- `hitTestsThisFrame` remains small and predictable
- hit-testing frequency correlates with interaction state, not pointer frequency
- increases in `shapeCount` increase hit-test work linearly and visibly

**Result**  
Hit-testing cost is bounded by interaction modeling rather than raw input frequency.  
Per-frame counts provide sufficient visibility without relying on noisy micro-timing.

---

## Undo / Redo

### History state (`historyInfo`)

**Observation**  
Undo / redo correctness depends on committing **semantic user actions**, not mechanical state updates.

**Metrics**
- `historyInfo.depth` — number of committed, undoable document patches
- `historyInfo.canUndo` — whether an undo operation is currently valid
- `historyInfo.canRedo` — whether a redo operation is currently valid

**Target**
- History depth increases only on semantic commits (e.g. completed drags, discrete commands)
- Redo history is invalidated on new commits
- History never underflows below the root state

**Result**  
Undo/redo behavior aligns with user intent, supports branching correctly, and remains stable under complex interaction sequences.

## Notes on Excluded Metrics

Certain metrics were intentionally **not included**:

- Per-hit timing (e.g. micro-timing individual hit-tests)  
  → too noisy, too small to be actionable, and encourages premature optimization

- Per-event reducer timing  
  → frame-level aggregation provides clearer architectural signals

If finer-grained timing is needed in the future, it can be introduced as **opt-in diagnostics** rather than always-on metrics.