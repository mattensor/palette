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
		runtime: {
			pointer: { kind: "idle" },
		},
	}
}

function POINTER_DOWN(prev: EditorState, event: EditorEvent): EditorState {
	return {
		...prev,
		runtime: {
			...prev.runtime,
			pointer: {
				kind: "dragging",
				id: event.pointerId,
				origin: event.position,
				current: event.position,
			},
		},
	}
}

function POINTER_MOVE(prev: EditorState, event: EditorEvent): EditorState {
	if (prev.runtime.pointer.kind !== "dragging") return prev
	if (prev.runtime.pointer.id !== event.pointerId) return prev

	return {
		...prev,
		runtime: {
			pointer: {
				...prev.runtime.pointer,
				current: event.position,
			},
		},
	}
}

function POINTER_UP(prev: EditorState, event: EditorEvent): EditorState {
	if (prev.runtime.pointer.kind !== "dragging") return prev
	if (prev.runtime.pointer.id !== event.pointerId) return prev

	const origin = prev.runtime.pointer.origin
	const current = event.position

	const rect = {
		id: crypto.randomUUID(),
		origin,
		size: {
			width: current.x - origin.x,
			height: current.y - origin.y,
		},
	}

	const shapes = new Map([...prev.doc.shapes])
	shapes.set(rect.id, rect)

	return {
		doc: {
			shapes,
		},
		runtime: {
			pointer: { kind: "idle" },
		},
	}
}

function POINTER_CANCEL(prev: EditorState, _event: EditorEvent): EditorState {
	return {
		...prev,
		runtime: {
			pointer: { kind: "idle" },
		},
	}
}

const handlers: Record<EditorEventType, EditorReducerHandler> = {
	POINTER_DOWN,
	POINTER_MOVE,
	POINTER_UP,
	POINTER_CANCEL,
}

export function editorReducer(
	prev: EditorState,
	event: EditorEvent,
): EditorState {
	const handler = handlers[event.type]

	return handler ? handler(prev, event) : prev
}
