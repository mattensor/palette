import type {
	CanvasPoint,
	PointerId,
} from "@/components/EditorCanvas/types/domain"

export type SpawnShapesEvent = {
	type: "SPAWN_SHAPES"
	count: number
}

export type Key = "Delete" | "Backspace" | "Escape" | "z"

export type Modifiers = {
	meta: boolean
	shift: boolean
	alt: boolean
	ctrl: boolean
}

export type PointerEventType =
	| "POINTER_DOWN"
	| "POINTER_MOVE"
	| "POINTER_UP"
	| "POINTER_CANCEL"

export type KeyboardEventType = "KEY_DOWN"

export type FrameTickEvent = {
	type: "FRAME_TICK"
	now: number
}

export type PointerEditorEvent = {
	type: PointerEventType
	pointerId: PointerId
	position: CanvasPoint
}

export type KeyboardEditorEvent = {
	type: KeyboardEventType
	key: Key
	modifiers: Modifiers
}

export type EditorEvent =
	| PointerEditorEvent
	| KeyboardEditorEvent
	| FrameTickEvent
	| SpawnShapesEvent

export type EditorEventType = EditorEvent["type"]
