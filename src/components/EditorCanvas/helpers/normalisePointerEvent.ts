import { createPointerId } from "@/components/EditorCanvas/helpers/createPointerId"
import type { EditorEvent } from "../types"

type CanvasPosition = { x: number; y: number }

const POINTER_TYPE_TO_EDITOR_EVENT_TYPE = {
	pointermove: "POINTER_MOVE",
	pointerdown: "POINTER_DOWN",
	pointerup: "POINTER_UP",
	pointercancel: "POINTER_CANCEL",
} as const

type PointerDomType = keyof typeof POINTER_TYPE_TO_EDITOR_EVENT_TYPE

export function normalisePointerEvent(
	event: React.PointerEvent<HTMLCanvasElement>,
	canvas: HTMLCanvasElement,
): EditorEvent {
	if (!(event.type in POINTER_TYPE_TO_EDITOR_EVENT_TYPE)) {
		throw new Error(`Unsupported pointer event type: ${event.type}`)
	}

	const position = toCanvasPosition(event, canvas)
	const type = POINTER_TYPE_TO_EDITOR_EVENT_TYPE[event.type as PointerDomType]

	return {
		type,
		pointerId: createPointerId(event.pointerId),
		position,
	}
}

export function toCanvasPosition(
	event: React.PointerEvent<HTMLCanvasElement>,
	canvas: HTMLCanvasElement,
): CanvasPosition {
	const rect = canvas.getBoundingClientRect()
	return {
		x: event.clientX - rect.left,
		y: event.clientY - rect.top,
	}
}
