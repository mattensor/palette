import { hitTestTopmostShape } from "@/components/EditorCanvas/helpers/hitTest"
import type { DocEffect } from "@/components/EditorCanvas/reducer/types"
import type {
	CanvasPoint,
	DocumentState,
	EditorState,
	Mode,
	PointerEditorEvent,
	PointerEventType,
	Rect,
	SessionState,
	ShapeId,
} from "@/components/EditorCanvas/types"

type PointerResult = { session: SessionState; effects: DocEffect[] }
type PointerEventHandler = (
	prev: EditorState,
	event: PointerEditorEvent,
) => PointerResult

function noop(prev: EditorState): PointerResult {
	return { session: prev.session, effects: [] }
}

function updateHover(
	prev: EditorState,
	hitShapeId: ShapeId | null,
): PointerResult {
	if (hitShapeId == null) {
		if (prev.session.hover.kind === "none") return noop(prev)
		return {
			session: { ...prev.session, hover: { kind: "none" } },
			effects: [],
		}
	}

	if (
		prev.session.hover.kind === "shape" &&
		prev.session.hover.id === hitShapeId
	) {
		return noop(prev)
	}

	return {
		session: { ...prev.session, hover: { kind: "shape", id: hitShapeId } },
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
	return { session: { ...prev.session, mode: { kind: "idle" } }, effects: [] }
}

function cancelToIdle(prev: EditorState): PointerResult {
	return {
		session: {
			...prev.session,
			mode: { kind: "idle" },
			hover: { kind: "none" },
		},
		effects: [],
	}
}

const downByMode: ModeHandlerMap = {
	idle(prev, event) {
		const hitShapeId = hitTestTopmostShape(prev.doc, event.position)

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
				effects: [],
			}
		}

		// Clicked shape: arm for dragging (only if we can resolve rect).
		const rect = getRect(prev.doc, hitShapeId)
		if (!rect) return noop(prev)

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

const moveByMode: ModeHandlerMap = {
	idle(prev, event) {
		return updateHover(prev, hitTestTopmostShape(prev.doc, event.position))
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
						pointerId, // use armed pointerId
						origin,
						current: event.position,
					},
				},
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
						pointerId, // use armed pointerId
						startPointer: intent.startPointer,
						startRect: intent.startRect,
					},
				},
				effects: [effect],
			}
		}

		return noop(prev)
	},

	draggingSelection(prev, event) {
		const m = prev.session.mode
		if (!samePointer(m, event)) return noop(prev)

		return {
			session: prev.session, // unchanged during drag
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
