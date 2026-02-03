import { hitTestTopmostShape } from "@/components/EditorCanvas/helpers/hitTest"
import { createAddRect } from "@/components/EditorCanvas/reducer/actions/createAddRect"
import { createUpdateRectPosition } from "@/components/EditorCanvas/reducer/actions/createUpdateRectPosition"

import type {
	CanvasPoint,
	DebugState,
	DocAction,
	DocumentState,
	EditorEvent,
	EditorState,
	PointerEditorEvent,
	PointerId,
	Rect,
	SessionState,
	ShapeId,
} from "@/components/EditorCanvas/types"

type PointerResult = {
	session: SessionState
	debug: DebugState
	actions: DocAction[]
}

/** ---------- tiny helpers: return shapes ---------- */

function noop(prev: EditorState): PointerResult {
	return { session: prev.session, debug: prev.debug, actions: [] }
}

function setMode(prev: EditorState, mode: SessionState["mode"]): PointerResult {
	return { session: { ...prev.session, mode }, debug: prev.debug, actions: [] }
}

function toIdle(prev: EditorState): PointerResult {
	return setMode(prev, { kind: "idle" })
}

function cancelToIdle(prev: EditorState): PointerResult {
	return {
		session: {
			...prev.session,
			mode: { kind: "idle" },
			hover: { kind: "none" },
		},
		debug: prev.debug,
		actions: [],
	}
}

/** ---------- geometry ---------- */

const MIN_DRAG = 3
function hasDragged(a: CanvasPoint, b: CanvasPoint) {
	return Math.abs(a.x - b.x) > MIN_DRAG || Math.abs(a.y - b.y) > MIN_DRAG
}

function delta(from: CanvasPoint, to: CanvasPoint) {
	return { dx: to.x - from.x, dy: to.y - from.y }
}

function translateRect(
	rect: Pick<Rect, "x" | "y">,
	d: { dx: number; dy: number },
) {
	return { x: rect.x + d.dx, y: rect.y + d.dy }
}

/** ---------- hit testing + hover (with metrics) ---------- */

function incHitTests(debug: DebugState): DebugState {
	return {
		...debug,
		metrics: { ...debug.metrics, hitTests: debug.metrics.hitTests + 1 },
	}
}

function hitTest(
	prev: EditorState,
	position: CanvasPoint,
): { hitShapeId: ShapeId | null; debug: DebugState } {
	const hitShapeId = hitTestTopmostShape(prev, position)
	return { hitShapeId, debug: incHitTests(prev.debug) }
}

function updateHover(
	prev: EditorState,
	hitShapeId: ShapeId | null,
	debug: DebugState,
): PointerResult {
	// no hit
	if (hitShapeId == null) {
		if (prev.session.hover.kind === "none") return { ...noop(prev), debug }
		return {
			session: { ...prev.session, hover: { kind: "none" } },
			debug,
			actions: [],
		}
	}

	// hit same
	if (
		prev.session.hover.kind === "shape" &&
		prev.session.hover.id === hitShapeId
	) {
		return { ...noop(prev), debug }
	}

	// new hit
	return {
		session: { ...prev.session, hover: { kind: "shape", id: hitShapeId } },
		debug,
		actions: [],
	}
}

function getRect(doc: DocumentState, id: ShapeId): Rect | null {
	return doc.shapes.get(id) ?? null
}

/** Prefer the latest sampled pointer position when available. */
function bestPointerPosition(
	prev: EditorState,
	pointerId: PointerId,
	fallback: CanvasPoint,
) {
	const lp = prev.session.latestPointer
	return lp.kind === "some" && lp.pointerId === pointerId
		? lp.position
		: fallback
}

/** ---------- event handlers ---------- */

function onPointerDown(
	prev: EditorState,
	event: PointerEditorEvent,
): PointerResult {
	// Only meaningful from idle.
	if (prev.session.mode.kind !== "idle") return noop(prev)

	const { hitShapeId, debug } = hitTest(prev, event.position)

	// empty space => arm draw
	if (hitShapeId == null) {
		return {
			session: {
				...prev.session,
				mode: {
					kind: "armed",
					pointerId: event.pointerId,
					origin: event.position,
					intent: { kind: "drawRect" },
				},
				hover: { kind: "none" },
				selection: { kind: "none" },
			},
			debug,
			actions: [],
		}
	}

	// shape => arm drag (only if rect exists)
	const rect = getRect(prev.doc, hitShapeId)
	if (!rect) return { ...noop(prev), debug }

	return {
		session: {
			...prev.session,
			mode: {
				kind: "armed",
				pointerId: event.pointerId,
				origin: event.position,
				intent: {
					kind: "dragSelection",
					shapeId: hitShapeId,
					startPointer: event.position,
					startRect: rect,
				},
			},
			hover: { kind: "none" },
			selection: { kind: "shape", id: hitShapeId },
		},
		debug,
		actions: [],
	}
}

/**
 * POINTER_MOVE: sample only
 * - store latest pointer sample for FRAME_TICK to consume
 */
function onPointerMove(
	prev: EditorState,
	event: PointerEditorEvent,
): PointerResult {
	return {
		session: {
			...prev.session,
			latestPointer: {
				kind: "some",
				pointerId: event.pointerId,
				position: event.position,
			},
		},
		debug: prev.debug,
		actions: [],
	}
}

/**
 * FRAME_TICK: advance interaction once per frame using latest pointer sample
 * - idle: hover hit test (bounded)
 * - armed: threshold -> transition to drawing/dragging
 * - dragging/drawing: update preview
 */
function onFrameTick(prev: EditorState): PointerResult {
	const lp = prev.session.latestPointer
	if (lp.kind !== "some") return noop(prev)

	const { pointerId, position } = lp
	const mode = prev.session.mode

	switch (mode.kind) {
		case "idle": {
			const { hitShapeId, debug } = hitTest(prev, position)
			return updateHover(prev, hitShapeId, debug)
		}

		case "armed": {
			if (mode.pointerId !== pointerId) return noop(prev)
			if (!hasDragged(mode.origin, position)) return noop(prev)

			if (mode.intent.kind === "drawRect") {
				return setMode(prev, {
					kind: "drawingRect",
					pointerId,
					origin: mode.origin,
					current: position,
				})
			}

			// dragSelection
			return setMode(prev, {
				kind: "draggingSelection",
				shapeId: mode.intent.shapeId,
				pointerId,
				startPointer: mode.intent.startPointer,
				currentPointer: position,
				startRect: mode.intent.startRect,
			})
		}

		case "draggingSelection": {
			if (mode.pointerId !== pointerId) return noop(prev)
			return setMode(prev, { ...mode, currentPointer: position })
		}

		case "drawingRect": {
			if (mode.pointerId !== pointerId) return noop(prev)
			return setMode(prev, { ...mode, current: position })
		}

		default:
			return noop(prev)
	}
}

function onPointerUp(
	prev: EditorState,
	event: PointerEditorEvent,
): PointerResult {
	const mode = prev.session.mode

	switch (mode.kind) {
		case "armed": {
			if (mode.pointerId !== event.pointerId) return noop(prev)
			return toIdle(prev)
		}

		case "draggingSelection": {
			if (mode.pointerId !== event.pointerId) return noop(prev)

			const end = bestPointerPosition(prev, event.pointerId, event.position)
			const d = delta(mode.startPointer, end)
			const pos = translateRect(mode.startRect, d)
			const action = createUpdateRectPosition(prev.doc, mode.shapeId, pos)

			return {
				session: { ...prev.session, mode: { kind: "idle" } },
				debug: prev.debug,
				actions: action ? [action] : [],
			}
		}

		case "drawingRect": {
			if (mode.pointerId !== event.pointerId) return noop(prev)

			const end = bestPointerPosition(prev, event.pointerId, event.position)

			return {
				session: { ...prev.session, mode: { kind: "idle" } },
				debug: prev.debug,
				actions: [createAddRect(mode.origin, end)],
			}
		}

		default:
			return noop(prev)
	}
}

function onPointerCancel(
	prev: EditorState,
	event: PointerEditorEvent,
): PointerResult {
	const mode = prev.session.mode

	// idle cancels always clear hover
	if (mode.kind === "idle") return cancelToIdle(prev)

	// otherwise cancel only if this pointer is the active one
	if ("pointerId" in mode && mode.pointerId === event.pointerId)
		return cancelToIdle(prev)

	return noop(prev)
}

/** ---------- public reducer ---------- */

export function pointerReducer(
	prev: EditorState,
	event: EditorEvent,
): PointerResult {
	switch (event.type) {
		case "POINTER_DOWN":
			return onPointerDown(prev, event)
		case "POINTER_MOVE":
			return onPointerMove(prev, event)
		case "FRAME_TICK":
			return onFrameTick(prev)
		case "POINTER_UP":
			return onPointerUp(prev, event)
		case "POINTER_CANCEL":
			return onPointerCancel(prev, event)
		default:
			return noop(prev)
	}
}
