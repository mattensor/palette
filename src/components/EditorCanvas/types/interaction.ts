import type { CanvasPoint, PointerId, Rect, ShapeId } from "./domain"

export type Key = "Delete" | "Backspace" | "Escape"

export type PointerEventType =
	| "POINTER_DOWN"
	| "POINTER_MOVE"
	| "POINTER_UP"
	| "POINTER_CANCEL"

export type KeyboardEventType = "KEY_DOWN"

export type PointerEditorEvent = {
	type: PointerEventType
	pointerId: PointerId
	position: CanvasPoint
}

export type KeyboardEditorEvent = {
	type: KeyboardEventType
	key: Key
}

export type EditorEvent = PointerEditorEvent | KeyboardEditorEvent
export type EditorEventType = EditorEvent["type"]

export type Intent =
	| { kind: "drawRect" }
	| {
			kind: "dragSelection"
			shapeId: ShapeId
			startPointer: CanvasPoint
			startRect: Rect
	  }

export type Mode =
	| { kind: "idle" }
	| {
			kind: "armed"
			pointerId: PointerId
			origin: CanvasPoint
			intent: Intent
	  }
	| {
			kind: "drawingRect"
			pointerId: PointerId
			origin: CanvasPoint
			current: CanvasPoint
	  }
	| {
			kind: "draggingSelection"
			pointerId: PointerId
			shapeId: ShapeId
			startPointer: CanvasPoint
			startRect: Rect
	  }

export type Selection = { kind: "none" } | { kind: "shape"; id: ShapeId }
export type Hover = { kind: "none" } | { kind: "shape"; id: ShapeId }

export type SessionState = {
	mode: Mode
	selection: Selection
	hover: Hover
}
