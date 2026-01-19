import { createShapeId } from "@/components/EditorCanvas/helpers/createShapeId"
import { normaliseRect } from "@/components/EditorCanvas/helpers/normaliseRect"
import type {
	DevLogEvent,
	EditorEvent,
	EditorEventType,
	EditorState,
} from "@/components/EditorCanvas/types"

type EditorReducerHandler = (
	prev: EditorState,
	event: EditorEvent,
) => EditorState

const DEVLOG_MAX = 200

function pushDevLog(prev: EditorState, entry: DevLogEvent): EditorState {
	const next = [...prev.debug.devLog, entry]
	const capped =
		next.length > DEVLOG_MAX ? next.slice(next.length - DEVLOG_MAX) : next

	return {
		...prev,
		debug: {
			...prev.debug,
			devLog: capped,
		},
	}
}

function log(prev: EditorState, name: string, data?: unknown): EditorState {
	return pushDevLog(prev, {
		ts: performance.now(),
		name,
		data,
	})
}

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
				lastRenderMs: null,
				shapeCount: 0,
			},
			devLog: [],
		},
	}
}

function POINTER_DOWN(prev: EditorState, event: EditorEvent): EditorState {
	if (prev.session.mode.kind !== "idle") return prev

	let next: EditorState = {
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

	next = log(next, "pointer/down", {
		pointerId: event.pointerId,
		pos: event.position,
	})
	next = log(next, "mode/change", { from: "idle", to: "dragging" })

	return next
}

function POINTER_MOVE(prev: EditorState, event: EditorEvent): EditorState {
	if (prev.session.mode.kind !== "dragging") return prev
	if (prev.session.mode.id !== event.pointerId) return prev

	// No logging here (too noisy)
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

	let next: EditorState = {
		...prev,
		doc: {
			...prev.doc,
			shapes,
		},
		session: {
			...prev.session,
			mode: { kind: "idle" },
		},
		debug: {
			...prev.debug,
			metrics: {
				...prev.debug.metrics,
				shapeCount: shapes.size,
			},
		},
	}

	next = log(next, "pointer/up", {
		pointerId: event.pointerId,
		pos: event.position,
	})
	next = log(next, "shape/commit", {
		id: rect.id,
		x: rect.x,
		y: rect.y,
		width: rect.width,
		height: rect.height,
	})
	next = log(next, "mode/change", { from: "dragging", to: "idle" })

	return next
}

function POINTER_CANCEL(prev: EditorState, event: EditorEvent): EditorState {
	const from = prev.session.mode.kind

	let next: EditorState = {
		...prev,
		session: {
			...prev.session,
			mode: { kind: "idle" },
		},
	}

	next = log(next, "pointer/cancel", {
		pointerId: event.pointerId,
		pos: event.position,
	})
	if (from !== "idle") next = log(next, "mode/change", { from, to: "idle" })

	return next
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
