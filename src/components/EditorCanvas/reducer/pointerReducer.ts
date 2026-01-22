import { hitTestTopmostShape } from "@/components/EditorCanvas/helpers/hitTest"
import type { DocEffect } from "@/components/EditorCanvas/reducer/types"
import type {
	CanvasPoint,
	EditorEvent,
	EditorEventType,
	EditorState,
	Rect,
	SessionState,
	ShapeId,
} from "@/components/EditorCanvas/types"

type PointerResult = { session: SessionState; effects: DocEffect[] }

type PointerEventHandler = (
	prev: EditorState,
	event: EditorEvent,
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

function POINTER_DOWN(prev: EditorState, event: EditorEvent): PointerResult {
	if (prev.session.mode.kind !== "idle") return noop(prev)

	const hitShapeId = hitTestTopmostShape(prev.doc, event.position)

	const selection =
		hitShapeId == null
			? ({ kind: "none" } as const)
			: ({ kind: "shape", id: hitShapeId } as const)

	const intent =
		hitShapeId == null
			? ({ kind: "drawRect" } as const)
			: ({
					kind: "dragSelection",
					shapeId: hitShapeId,
					startPointer: event.position,
					startRect: prev.doc.shapes.get(hitShapeId) as Rect,
				} as const)

	return {
		session: {
			...prev.session,
			mode: {
				kind: "armed",
				origin: event.position,
				current: event.position,
				intent,
			},
			hover: { kind: "none" },
			selection,
		},
		effects: [],
	}
}

function POINTER_MOVE(prev: EditorState, event: EditorEvent): PointerResult {
	if (prev.session.mode.kind === "idle") {
		const hitShapeId = hitTestTopmostShape(prev.doc, event.position)
		return updateHover(prev, hitShapeId)
	}

	if (
		prev.session.mode.kind === "armed" &&
		prev.session.mode.intent.kind === "drawRect"
	) {
		if (!hasDragged(prev.session.mode.origin, event.position)) return noop(prev)

		return {
			session: {
				...prev.session,
				mode: {
					kind: "drawingRect",
					pointerId: event.pointerId,
					origin: prev.session.mode.origin,
					current: event.position,
				},
			},
			effects: [],
		}
	}

	if (
		prev.session.mode.kind === "armed" &&
		prev.session.mode.intent.kind === "dragSelection"
	) {
		if (!hasDragged(prev.session.mode.origin, event.position)) return noop(prev)

		const deltaX = event.position.x - prev.session.mode.intent.startPointer.x
		const deltaY = event.position.y - prev.session.mode.intent.startPointer.y

		const effect: DocEffect = {
			type: "SET_SHAPE_POSITION",
			id: prev.session.mode.intent.shapeId,
			x: prev.session.mode.intent.startRect.x + deltaX,
			y: prev.session.mode.intent.startRect.y + deltaY,
		}

		// Anchored Dragging
		// we preserve the start pointer and start rect
		// we calculate the delta of current position - start position
		// then we update the the rects coords by the delta
		return {
			session: {
				...prev.session,
				mode: {
					kind: "draggingSelection",
					shapeId: prev.session.mode.intent.shapeId, // needs to infer
					pointerId: event.pointerId,
					startPointer: prev.session.mode.intent.startPointer,
					startRect: prev.session.mode.intent.startRect, // can get the rect again
				},
			},
			effects: [effect],
		}
	}

	if (prev.session.mode.kind === "draggingSelection") {
		const deltaX = event.position.x - prev.session.mode.startPointer.x
		const deltaY = event.position.y - prev.session.mode.startPointer.y

		const effect: DocEffect = {
			type: "SET_SHAPE_POSITION",
			id: prev.session.mode.shapeId,
			x: prev.session.mode.startRect.x + deltaX,
			y: prev.session.mode.startRect.y + deltaY,
		}

		// Anchored Dragging
		// we preserve the start pointer and start rect
		// we calculate the delta of current position - start position
		// then we update the the rects coords by the delta
		return {
			session: {
				...prev.session,
				mode: {
					kind: "draggingSelection",
					shapeId: prev.session.mode.shapeId, // needs to infer
					pointerId: event.pointerId,
					startPointer: prev.session.mode.startPointer,
					startRect: prev.session.mode.startRect, // can get the rect again
				},
			},
			effects: [effect],
		}
	}

	if (prev.session.mode.kind !== "drawingRect") return noop(prev)
	if (prev.session.mode.pointerId !== event.pointerId) return noop(prev)

	return {
		session: {
			...prev.session,
			mode: {
				...prev.session.mode,
				current: event.position,
			},
		},
		effects: [],
	}
}

function POINTER_UP(prev: EditorState, event: EditorEvent): PointerResult {
	if (prev.session.mode.kind === "armed") {
		return {
			session: {
				...prev.session,
				mode: { kind: "idle" },
			},
			effects: [],
		}
	}

	if (prev.session.mode.kind === "draggingSelection") {
		if (prev.session.mode.pointerId !== event.pointerId) return noop(prev)

		return {
			session: {
				...prev.session,
				mode: { kind: "idle" },
				selection: { kind: "none" },
			},
			effects: [],
		}
	}

	if (prev.session.mode.kind !== "drawingRect") return noop(prev)
	if (prev.session.mode.pointerId !== event.pointerId) return noop(prev)

	// Pointer reducer emits intent only; doc layer creates ids + normalizes shapes.
	const effect: DocEffect = {
		type: "COMMIT_DRAW_RECT",
		origin: prev.session.mode.origin,
		current: event.position,
	}

	return {
		session: {
			...prev.session,
			mode: { kind: "idle" },
		},
		effects: [effect],
	}
}

function POINTER_CANCEL(prev: EditorState, _event: EditorEvent): PointerResult {
	return {
		session: {
			...prev.session,
			mode: { kind: "idle" },
			hover: { kind: "none" },
		},
		effects: [],
	}
}

const pointerEventHandlers: Record<EditorEventType, PointerEventHandler> = {
	POINTER_DOWN,
	POINTER_MOVE,
	POINTER_UP,
	POINTER_CANCEL,
}

export function pointerReducer(
	prev: EditorState,
	event: EditorEvent,
): PointerResult {
	const handler = pointerEventHandlers[event.type]

	return handler ? handler(prev, event) : noop(prev)
}
