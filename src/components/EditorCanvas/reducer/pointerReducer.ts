import { hitTestTopmostShape } from "@/components/EditorCanvas/helpers/hitTest"

import type {
	CanvasPoint,
	DebugState,
	DocEffect,
	DocumentState,
	EditorState,
	Mode,
	PointerEditorEvent,
	PointerEventType,
	Rect,
	SessionState,
	ShapeId,
} from "@/components/EditorCanvas/types"

type PointerResult = {
	session: SessionState
	debug: DebugState
	effects: DocEffect[]
}

type PointerEventHandler = (
	prev: EditorState,
	event: PointerEditorEvent,
) => PointerResult

function noop(prev: EditorState): PointerResult {
	return { session: prev.session, debug: prev.debug, effects: [] }
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

/**
 * Hit-test wrapper that guarantees the metric is incremented exactly
 * when we hit-test (and nowhere else).
 */
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
			effects: [],
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
		effects: [],
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

type ModeKind = Mode["kind"]
type ModeOf<K extends ModeKind> = Extract<Mode, { kind: K }>
type StateWithMode<K extends ModeKind> = EditorState & {
	session: SessionState & { mode: ModeOf<K> }
}

type ModeHandlerMap = {
	[K in ModeKind]?: (
		prev: StateWithMode<K>,
		event: PointerEditorEvent,
	) => PointerResult
}

function handleByMode(
	handlers: ModeHandlerMap,
	prev: EditorState,
	event: PointerEditorEvent,
): PointerResult {
	const kind = prev.session.mode.kind
	const handler = handlers[kind] as
		| ((p: EditorState, e: PointerEditorEvent) => PointerResult)
		| undefined

	return handler ? handler(prev, event) : noop(prev)
}

function moveSelectionEffect(
	id: ShapeId,
	startRect: Rect,
	startPointer: CanvasPoint,
	currentPointer: CanvasPoint,
): DocEffect {
	const d = delta(startPointer, currentPointer)
	const pos = translateRect(startRect, d)
	return { type: "SET_SHAPE_POSITION", id, x: pos.x, y: pos.y }
}

function toIdle(prev: EditorState): PointerResult {
	return {
		session: { ...prev.session, mode: { kind: "idle" } },
		debug: prev.debug,
		effects: [],
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
		effects: [],
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
				effects: [],
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
			effects: [],
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
		const m = prev.session.mode
		if (!samePointer(m, event)) return noop(prev)

		const { origin, intent, pointerId } = m
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
				effects: [],
			}
		}

		if (intent.kind === "dragSelection") {
			const effect = moveSelectionEffect(
				intent.shapeId,
				intent.startRect,
				intent.startPointer,
				event.position,
			)

			return {
				session: {
					...prev.session,
					mode: {
						kind: "draggingSelection",
						shapeId: intent.shapeId,
						pointerId,
						startPointer: intent.startPointer,
						startRect: intent.startRect,
					},
				},
				debug: prev.debug,
				effects: [effect],
			}
		}

		return noop(prev)
	},

	draggingSelection(prev, event) {
		const m = prev.session.mode
		if (!samePointer(m, event)) return noop(prev)

		return {
			session: prev.session,
			debug: prev.debug,
			effects: [
				moveSelectionEffect(
					m.shapeId,
					m.startRect,
					m.startPointer,
					event.position,
				),
			],
		}
	},

	drawingRect(prev, event) {
		const m = prev.session.mode
		if (!samePointer(m, event)) return noop(prev)

		return {
			session: { ...prev.session, mode: { ...m, current: event.position } },
			debug: prev.debug,
			effects: [],
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
		const m = prev.session.mode
		if (!samePointer(m, event)) return noop(prev)
		return toIdle(prev)
	},

	draggingSelection(prev, event) {
		const m = prev.session.mode
		if (!samePointer(m, event)) return noop(prev)

		return {
			session: {
				...prev.session,
				mode: { kind: "idle" },
			},
			debug: prev.debug,
			effects: [],
		}
	},

	drawingRect(prev, event) {
		const m = prev.session.mode
		if (!samePointer(m, event)) return noop(prev)

		const effect: DocEffect = {
			type: "COMMIT_DRAW_RECT",
			origin: m.origin,
			current: event.position,
		}

		return {
			session: { ...prev.session, mode: { kind: "idle" } },
			debug: prev.debug,
			effects: [effect],
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
	idle(prev) {
		return cancelToIdle(prev)
	},
	armed(prev, event) {
		const m = prev.session.mode
		if (!samePointer(m, event)) return noop(prev)
		return cancelToIdle(prev)
	},
	drawingRect(prev, event) {
		const m = prev.session.mode
		if (!samePointer(m, event)) return noop(prev)
		return cancelToIdle(prev)
	},
	draggingSelection(prev, event) {
		const m = prev.session.mode
		if (!samePointer(m, event)) return noop(prev)
		return cancelToIdle(prev)
	},
}

function POINTER_CANCEL(
	prev: EditorState,
	event: PointerEditorEvent,
): PointerResult {
	return handleByMode(cancelByMode, prev, event)
}

const pointerEventHandlers: Record<PointerEventType, PointerEventHandler> = {
	POINTER_DOWN,
	POINTER_MOVE,
	POINTER_UP,
	POINTER_CANCEL,
}

export function pointerReducer(
	prev: EditorState,
	event: PointerEditorEvent,
): PointerResult {
	const handler = pointerEventHandlers[event.type]
	return handler ? handler(prev, event) : noop(prev)
}
