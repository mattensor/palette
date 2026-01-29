import { hitTestTopmostShape } from "@/components/EditorCanvas/helpers/hitTest"
import { createAddRect } from "@/components/EditorCanvas/reducer/actions/createAddRect"
import { createUpdateRectPosition } from "@/components/EditorCanvas/reducer/actions/createUpdateRectPosition"

import type {
	CanvasPoint,
	DebugState,
	DocAction,
	DocumentState,
	EditorState,
	Mode,
	PointerEditorEvent,
	Rect,
	SessionState,
	ShapeId,
} from "@/components/EditorCanvas/types"

type PointerResult = {
	session: SessionState
	debug: DebugState
	actions: DocAction[]
}

type ModeKind = Mode["kind"]
type ModeHandler = (
	prev: EditorState,
	event: PointerEditorEvent,
) => PointerResult
type ModeHandlerMap = Partial<Record<ModeKind, ModeHandler>>

function noop(prev: EditorState): PointerResult {
	return { session: prev.session, debug: prev.debug, actions: [] }
}

function incHitTests(debug: DebugState): DebugState {
	return {
		...debug,
		metrics: {
			...debug.metrics,
			hitTests: debug.metrics.hitTests + 1,
		},
	}
}

function hitTest(
	prev: EditorState,
	position: CanvasPoint,
): { hitShapeId: ShapeId | null; debug: DebugState } {
	const hitShapeId = hitTestTopmostShape(prev.doc, position)
	return { hitShapeId, debug: incHitTests(prev.debug) }
}

function updateHover(
	prev: EditorState,
	hitShapeId: ShapeId | null,
	debug: DebugState,
): PointerResult {
	if (hitShapeId == null) {
		if (prev.session.hover.kind === "none") {
			// still return updated debug to preserve metric increment
			return { ...noop(prev), debug }
		}
		return {
			session: { ...prev.session, hover: { kind: "none" } },
			debug,
			actions: [],
		}
	}

	if (
		prev.session.hover.kind === "shape" &&
		prev.session.hover.id === hitShapeId
	) {
		// still return updated debug to preserve metric increment
		return { ...noop(prev), debug }
	}

	return {
		session: { ...prev.session, hover: { kind: "shape", id: hitShapeId } },
		debug,
		actions: [],
	}
}

const MIN_DRAG = 3
function hasDragged(a: CanvasPoint, b: CanvasPoint) {
	return Math.abs(a.x - b.x) > MIN_DRAG || Math.abs(a.y - b.y) > MIN_DRAG
}

function samePointer(mode: { pointerId: unknown }, event: PointerEditorEvent) {
	return mode.pointerId === event.pointerId
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

function getRect(doc: DocumentState, id: ShapeId): Rect | null {
	return doc.shapes.get(id) ?? null
}

function handleByMode(
	handlers: ModeHandlerMap,
	prev: EditorState,
	event: PointerEditorEvent,
): PointerResult {
	return handlers[prev.session.mode.kind]?.(prev, event) ?? noop(prev)
}

// Narrow mode inside handlers without heavy mapped typing
function requireMode<K extends ModeKind>(
	prev: EditorState,
	kind: K,
): Extract<Mode, { kind: K }> | null {
	const mode = prev.session.mode
	return mode.kind === kind ? (mode as Extract<Mode, { kind: K }>) : null
}

function toIdle(prev: EditorState): PointerResult {
	return {
		session: { ...prev.session, mode: { kind: "idle" } },
		debug: prev.debug,
		actions: [],
	}
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

/**
 * POINTER_DOWN
 * - Hit-test exactly once to resolve intent.
 */
const downByMode: ModeHandlerMap = {
	idle(prev, event) {
		const { hitShapeId, debug } = hitTest(prev, event.position)

		// Clicked empty space: arm for drawing.
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

		// Clicked shape: arm for dragging (only if we can resolve rect).
		const rect = getRect(prev.doc, hitShapeId)
		if (!rect) {
			// still preserve debug increment
			return { ...noop(prev), debug }
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
			debug,
			actions: [],
		}
	},
}

function POINTER_DOWN(
	prev: EditorState,
	event: PointerEditorEvent,
): PointerResult {
	return handleByMode(downByMode, prev, event)
}

/**
 * POINTER_MOVE
 * - While idle: hit-test to update hover.
 * - While armed/dragging: no hit-test needed (we already resolved intent on down).
 */
const moveByMode: ModeHandlerMap = {
	idle(prev, event) {
		const { hitShapeId, debug } = hitTest(prev, event.position)
		return updateHover(prev, hitShapeId, debug)
	},

	armed(prev, event) {
		const mode = requireMode(prev, "armed")
		if (!mode || !samePointer(mode, event)) return noop(prev)

		const { origin, intent, pointerId } = mode
		if (!hasDragged(origin, event.position)) return noop(prev)

		if (intent.kind === "drawRect") {
			return {
				session: {
					...prev.session,
					mode: {
						kind: "drawingRect",
						pointerId,
						origin,
						current: event.position,
					},
				},
				debug: prev.debug,
				actions: [],
			}
		}

		if (intent.kind === "dragSelection") {
			return {
				session: {
					...prev.session,
					mode: {
						kind: "draggingSelection",
						shapeId: intent.shapeId,
						pointerId,
						startPointer: intent.startPointer,
						currentPointer: event.position,
						startRect: intent.startRect,
					},
				},
				debug: prev.debug,
				actions: [],
			}
		}

		return noop(prev)
	},

	draggingSelection(prev, event) {
		const mode = requireMode(prev, "draggingSelection")
		if (!mode || !samePointer(mode, event)) return noop(prev)

		return {
			session: {
				...prev.session,
				mode: {
					...mode,
					currentPointer: event.position,
				},
			},
			debug: prev.debug,
			actions: [],
		}
	},

	drawingRect(prev, event) {
		const mode = requireMode(prev, "drawingRect")
		if (!mode || !samePointer(mode, event)) return noop(prev)

		return {
			session: { ...prev.session, mode: { ...mode, current: event.position } },
			debug: prev.debug,
			actions: [],
		}
	},
}

function POINTER_MOVE(
	prev: EditorState,
	event: PointerEditorEvent,
): PointerResult {
	return handleByMode(moveByMode, prev, event)
}

const upByMode: ModeHandlerMap = {
	armed(prev, event) {
		const mode = requireMode(prev, "armed")
		if (!mode || !samePointer(mode, event)) return noop(prev)
		return toIdle(prev)
	},

	draggingSelection(prev, event) {
		const mode = requireMode(prev, "draggingSelection")
		if (!mode || !samePointer(mode, event)) return noop(prev)

		const d = delta(mode.startPointer, event.position)
		const pos = translateRect(mode.startRect, d)
		const action = createUpdateRectPosition(prev.doc, mode.shapeId, pos)

		return {
			session: {
				...prev.session,
				mode: { kind: "idle" },
			},
			debug: prev.debug,
			actions: action ? [action] : [],
		}
	},

	drawingRect(prev, event) {
		const mode = requireMode(prev, "drawingRect")
		if (!mode || !samePointer(mode, event)) return noop(prev)

		return {
			session: { ...prev.session, mode: { kind: "idle" } },
			debug: prev.debug,
			actions: [createAddRect(mode.origin, event.position)],
		}
	},
}

function POINTER_UP(
	prev: EditorState,
	event: PointerEditorEvent,
): PointerResult {
	return handleByMode(upByMode, prev, event)
}

const cancelByMode: ModeHandlerMap = {
	idle(prev, _event) {
		return cancelToIdle(prev)
	},
	armed(prev, event) {
		const mode = requireMode(prev, "armed")
		if (!mode || !samePointer(mode, event)) return noop(prev)
		return cancelToIdle(prev)
	},
	drawingRect(prev, event) {
		const mode = requireMode(prev, "drawingRect")
		if (!mode || !samePointer(mode, event)) return noop(prev)
		return cancelToIdle(prev)
	},
	draggingSelection(prev, event) {
		const mode = requireMode(prev, "draggingSelection")
		if (!mode || !samePointer(mode, event)) return noop(prev)
		return cancelToIdle(prev)
	},
}

function POINTER_CANCEL(
	prev: EditorState,
	event: PointerEditorEvent,
): PointerResult {
	return handleByMode(cancelByMode, prev, event)
}

export function pointerReducer(
	prev: EditorState,
	event: PointerEditorEvent,
): PointerResult {
	switch (event.type) {
		case "POINTER_DOWN":
			return POINTER_DOWN(prev, event)
		case "POINTER_MOVE":
			return POINTER_MOVE(prev, event)
		case "POINTER_UP":
			return POINTER_UP(prev, event)
		case "POINTER_CANCEL":
			return POINTER_CANCEL(prev, event)
		default:
			return noop(prev)
	}
}
