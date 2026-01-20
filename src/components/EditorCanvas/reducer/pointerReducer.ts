import { hitTestTopmostShape } from "@/components/EditorCanvas/helpers/hitTest"
import type { DocEffect } from "@/components/EditorCanvas/reducer/types"
import type {
	EditorEvent,
	EditorEventType,
	EditorState,
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

function POINTER_DOWN(prev: EditorState, event: EditorEvent): PointerResult {
	if (prev.session.mode.kind !== "idle") return noop(prev)

	const hitShapeId = hitTestTopmostShape(prev.doc, event.position)
	if (hitShapeId != null) return noop(prev)

	return {
		session: {
			...prev.session,
			mode: {
				kind: "drawingRect",
				pointerId: event.pointerId,
				origin: event.position,
				current: event.position,
			},
			hover: { kind: "none" },
		},
		effects: [],
	}
}

function POINTER_MOVE(prev: EditorState, event: EditorEvent): PointerResult {
	if (prev.session.mode.kind === "idle") {
		const hitShapeId = hitTestTopmostShape(prev.doc, event.position)
		return updateHover(prev, hitShapeId)
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
	if (prev.session.mode.kind !== "drawingRect") return noop(prev)
	if (prev.session.mode.pointerId !== event.pointerId) return noop(prev)

	return {
		session: {
			...prev.session,
			mode: { kind: "idle" },
		},
		effects: [],
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
