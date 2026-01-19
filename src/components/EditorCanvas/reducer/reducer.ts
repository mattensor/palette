import { createShapeId } from "@/components/EditorCanvas/helpers/createShapeId"
import { normaliseRect } from "@/components/EditorCanvas/helpers/normaliseRect"
import type {
	EditorEvent,
	EditorEventType,
	EditorState,
} from "@/components/EditorCanvas/types"

type EditorReducerHandler = (
	prev: EditorState,
	event: EditorEvent,
) => EditorState

export function createInitialState(): EditorState {
	return {
		doc: {
			shapes: new Map(),
		},
		session: {
			mode: { kind: "idle" },
		},
		debug: {
			metrics: {
				lastFrameMs: null,
				shapeCount: 0,
			},
			devLog: [],
		},
	}
}

function POINTER_DOWN(prev: EditorState, event: EditorEvent): EditorState {
	return {
		...prev,
		session: {
			...prev.session,
			mode: {
				kind: "dragging",
				id: event.pointerId,
				origin: event.position,
				current: event.position,
			},
		},
	}
}

function POINTER_MOVE(prev: EditorState, event: EditorEvent): EditorState {
	if (prev.session.mode.kind !== "dragging") return prev
	if (prev.session.mode.id !== event.pointerId) return prev

	return {
		...prev,
		session: {
			...prev.session,
			mode: {
				...prev.session.mode,
				current: event.position,
			},
		},
	}
}

function POINTER_UP(prev: EditorState, event: EditorEvent): EditorState {
	if (prev.session.mode.kind !== "dragging") return prev
	if (prev.session.mode.id !== event.pointerId) return prev

	const origin = prev.session.mode.origin
	const current = event.position

	const rect = normaliseRect(origin, current, createShapeId())

	const shapes = new Map(prev.doc.shapes)
	shapes.set(rect.id, rect)

	return {
		...prev,
		doc: {
			...prev.doc,
			shapes,
		},
		session: {
			...prev.session,
			mode: { kind: "idle" },
		},
	}
}

function POINTER_CANCEL(prev: EditorState, _event: EditorEvent): EditorState {
	return {
		...prev,
		session: {
			...prev.session,
			mode: { kind: "idle" },
		},
	}
}

const handlers: Record<EditorEventType, EditorReducerHandler> = {
	POINTER_DOWN,
	POINTER_MOVE,
	POINTER_UP,
	POINTER_CANCEL,
}

export function reducer(prev: EditorState, event: EditorEvent): EditorState {
	const handler = handlers[event.type]

	return handler ? handler(prev, event) : prev
}
