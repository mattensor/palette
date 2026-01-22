import type * as React from "react"
import { createPointerId } from "@/components/EditorCanvas/helpers/createPointerId"
import type {
	CanvasPoint,
	EditorEvent,
	Key,
} from "@/components/EditorCanvas/types"

const POINTER_TYPE_TO_EDITOR_EVENT_TYPE = {
	pointermove: "POINTER_MOVE",
	pointerdown: "POINTER_DOWN",
	pointerup: "POINTER_UP",
	pointercancel: "POINTER_CANCEL",
} as const

const KEYBOARD_TYPE_TO_EDITOR_EVENT_TYPE = {
	keydown: "KEY_DOWN",
} as const

const KEYBOARD_KEY_MAP = {
	Backspace: "Backspace",
	Delete: "Delete",
	Escape: "Escape",
} as const satisfies Record<string, Key>

type PointerDomType = keyof typeof POINTER_TYPE_TO_EDITOR_EVENT_TYPE
type KeyboardKeyType = keyof typeof KEYBOARD_KEY_MAP

type KeyDownEvent = Extract<EditorEvent, { type: "KEY_DOWN" }>

export function normalisePointerEvent(
	event: React.PointerEvent<HTMLCanvasElement>,
	canvas: HTMLCanvasElement,
): EditorEvent {
	if (!(event.type in POINTER_TYPE_TO_EDITOR_EVENT_TYPE)) {
		throw new Error(`Unsupported pointer event type: ${event.type}`)
	}

	const type = POINTER_TYPE_TO_EDITOR_EVENT_TYPE[event.type as PointerDomType]

	return {
		type,
		pointerId: createPointerId(event.pointerId),
		position: toCanvasPoint(event, canvas),
	}
}

export function normaliseKeyboardEvent(
	event: React.KeyboardEvent<HTMLCanvasElement>,
): KeyDownEvent | null {
	if (!(event.type in KEYBOARD_TYPE_TO_EDITOR_EVENT_TYPE)) return null

	const key = KEYBOARD_KEY_MAP[event.key as KeyboardKeyType]
	if (!key) return null

	return { type: "KEY_DOWN", key }
}

export function toCanvasPoint(
	event: React.PointerEvent<HTMLCanvasElement>,
	canvas: HTMLCanvasElement,
): CanvasPoint {
	const rect = canvas.getBoundingClientRect()
	return {
		x: event.clientX - rect.left,
		y: event.clientY - rect.top,
	}
}
