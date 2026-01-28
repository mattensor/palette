# Editor History & Undo Architecture

## Scope

This document describes how undo and redo work for Palette, our canvas-based editor.

Undo/redo applies only to document state (shapes and layout). It does not directly control rendering or manipulate ephemeral UI/session state such as pointer position or hover.

## What Is Undoable

Not all editor actions are undoable.

Included:
- Adding a shape
- Deleting a shape
- Moving a shape

Excluded:
- Pointer movement
- Hover state
- Drag-in-progress state
- Other ephemeral interaction or debug state

Ephemeral state is handled by the interaction model and is intentionally excluded from history.

## When History Entries Are Created

History entries are created only at final commit points, not for every state update.

Most commit points occur on pointerup.

For example, when moving a shape, the document position may be updated many times during a drag for rendering purposes. However, a single undo is expected to return the shape to its original position after the drag completes. Because of this, drag interactions produce one history entry on commit.

Commit points include:
- Pointer up after dragging
- Pointer up after drawing
- Pressing the Delete key

## History Model

History is modeled as a linear timeline with no branching.

The model consists of:
- Past patches (available for undo)
- Current document state
- Future patches (available for redo)

If a new undoable action is committed after an undo, all future patches are cleared.

## Representation

History is represented as document patches, not full snapshots of editor state.

A patch captures the minimal reversible change:
- the affected entity or entities
- the before document values
- the after document values

Patch history is immutable. Redo history is intentionally discarded when a new action is committed after undo.

Undo applies a patch backward.
Redo applies a patch forward.

This approach avoids copying the entire document on each history entry and scales with the number of changed entities rather than document size.

## Undo / Redo Semantics

- Undo reverts the most recently committed patch.
- Redo reapplies the most recently undone patch.
- If a new undoable action occurs after undo, redo history is invalidated.

This enforces a simple and predictable linear history model.

## Interaction & Cancellation Behavior

During interactions such as dragging, the document may be updated continuously to provide live visual feedback.

To keep history correct:
- History is updated only on commit points.
- If an interaction is canceled (e.g. pointer cancel or Escape), the document is restored to its pre-interaction state.
- Canceled interactions do not create history entries.

## Constraints

- History is linear; branching history is not supported.
- Collaborative editing is out of scope.

## TODO / Open Questions
- Should history size be bounded, and what should the limits be?
- Should selection state be undoable?
- Should keyboard repeats be grouped into a single undo step?

## Other Approaches Considered

### Snapshots

Storing full document snapshots for each history entry is simple to implement but can be memory-intensive as document size grows. This approach was intentionally avoided.

### Commands

Commands are a further abstraction over patches and can provide cleaner boundaries, but require additional structure and ceremony. For now, patches provide the minimal effective solution.

### Event Log

An event log would allow rebuilding document state by replaying all undoable actions. While useful for large or collaborative systems, this approach is unnecessarily complex for the current scope of the editor.

## Summary

Undo and redo are implemented as a patch-based, transactional history over document state, with clear commit boundaries and strict separation from ephemeral UI state.

This design prioritises correctness, performance, and predictability while keeping the system simple and maintainable.
