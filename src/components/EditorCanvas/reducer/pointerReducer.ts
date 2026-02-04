import { hitTestTopmostShape } from "@/components/EditorCanvas/helpers/hitTest"
import { createAddRect } from "@/components/EditorCanvas/reducer/actions/createAddRect"
import { createUpdateRectPosition } from "@/components/EditorCanvas/reducer/actions/createUpdateRectPosition"
import type {
	EditorEvent,
	EditorState,
	PointerEditorEvent,
	SessionState,
} from "@/components/EditorCanvas/types"
import type {
	CanvasPoint,
	DocumentState,
	PointerId,
	Rect,
	ShapeId,
} from "@/components/EditorCanvas/types/domain" // adjust if these live elsewhere
import type { PerfEvent } from "@/components/EditorCanvas/types/perf"
import type { InteractionResult } from "./types"

/** ---------- result helper ---------- */

function noop(prev: EditorState): InteractionResult {
	return { session: prev.session, actions: [], perf: [] }
}

function setMode(
	prev: EditorState,
	mode: SessionState["mode"],
): InteractionResult {
	return { session: { ...prev.session, mode }, actions: [], perf: [] }
}

function toIdle(prev: EditorState): InteractionResult {
	return setMode(prev, { kind: "idle" })
}

function cancelToIdle(prev: EditorState): InteractionResult {
	return {
		session: {
			...prev.session,
			mode: { kind: "idle" },
			hover: { kind: "none" },
			latestPointer: { kind: "none" },
		},
		actions: [],
		perf: [],
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

/** ---------- doc helpers ---------- */

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

/** ---------- hit testing (perf events) ---------- */

function hitTest(
	prev: EditorState,
	position: CanvasPoint,
): { hitShapeId: ShapeId | null; perf: PerfEvent } {
	const t0 = performance.now()
	const hitShapeId = hitTestTopmostShape(prev.doc, position)
	const ms = performance.now() - t0
	return { hitShapeId, perf: { type: "HIT_TEST", ms } }
}

function updateHover(
	prev: EditorState,
	hitShapeId: ShapeId | null,
): InteractionResult {
	// no hit
	if (hitShapeId == null) {
		if (prev.session.hover.kind === "none") return noop(prev)
		return {
			session: { ...prev.session, hover: { kind: "none" } },
			actions: [],
			perf: [],
		}
	}

	// hit same
	if (
		prev.session.hover.kind === "shape" &&
		prev.session.hover.id === hitShapeId
	) {
		return noop(prev)
	}

	// new hit
	return {
		session: { ...prev.session, hover: { kind: "shape", id: hitShapeId } },
		actions: [],
		perf: [],
	}
}

/** ---------- event handlers ---------- */

function onPointerDown(
	prev: EditorState,
	event: PointerEditorEvent,
): InteractionResult {
	// Only meaningful from idle.
	if (prev.session.mode.kind !== "idle") return noop(prev)

	const { hitShapeId, perf } = hitTest(prev, event.position)

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
			actions: [],
			perf: [perf],
		}
	}

	// shape => arm drag (only if rect exists)
	const rect = getRect(prev.doc, hitShapeId)
	if (!rect) {
		return { ...noop(prev), perf: [perf] }
	}

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
		actions: [],
		perf: [perf],
	}
}

/**
 * POINTER_MOVE: sample only
 * - store latest pointer sample for FRAME_TICK to consume
 */
function onPointerMove(
	prev: EditorState,
	event: PointerEditorEvent,
): InteractionResult {
	return {
		session: {
			...prev.session,
			latestPointer: {
				kind: "some",
				pointerId: event.pointerId,
				position: event.position,
			},
		},
		actions: [],
		perf: [],
	}
}

/**
 * FRAME_TICK: advance interaction once per frame using latest pointer sample
 * - idle: hover hit test (bounded)
 * - armed: threshold -> transition to drawing/dragging
 * - dragging/drawing: update preview
 */
function onFrameTick(prev: EditorState): InteractionResult {
	const lp = prev.session.latestPointer
	if (lp.kind !== "some") return noop(prev)

	const { pointerId, position } = lp
	const mode = prev.session.mode

	switch (mode.kind) {
		case "idle": {
			const { hitShapeId, perf } = hitTest(prev, position)
			const hoverResult = updateHover(prev, hitShapeId)
			return {
				session: hoverResult.session,
				actions: hoverResult.actions,
				perf: [perf, ...hoverResult.perf],
			}
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
): InteractionResult {
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
				actions: action ? [action] : [],
				perf: [],
			}
		}

		case "drawingRect": {
			if (mode.pointerId !== event.pointerId) return noop(prev)

			const end = bestPointerPosition(prev, event.pointerId, event.position)

			return {
				session: { ...prev.session, mode: { kind: "idle" } },
				actions: [createAddRect(mode.origin, end)],
				perf: [],
			}
		}

		default:
			return noop(prev)
	}
}

function onPointerCancel(
	prev: EditorState,
	event: PointerEditorEvent,
): InteractionResult {
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
): InteractionResult {
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
