export type CanvasPoint = { readonly x: number; readonly y: number }

type Brand<K, T extends string> = K & { readonly __brand: T }
export type PointerId = Brand<string, "PointerId">
export type ShapeId = Brand<string, "ShapeId">

export type Key = "Delete" | "Backspace" | "Escape"

export type EditorEvent =
	| {
			type: "POINTER_DOWN"
			pointerId: PointerId
			position: CanvasPoint
	  }
	| {
			type: "POINTER_MOVE"
			pointerId: PointerId
			position: CanvasPoint
	  }
	| {
			type: "POINTER_UP"
			pointerId: PointerId
			position: CanvasPoint
	  }
	| {
			type: "POINTER_CANCEL"
			pointerId: PointerId
			position: CanvasPoint
	  }
	| { type: "KEY_DOWN"; key: Key }

export type EditorEventType = EditorEvent["type"]

export type PointerEditorEvent = Extract<
	EditorEvent,
	{ type: PointerEventType }
>

export type PointerEventType = Extract<
	EditorEventType,
	"POINTER_DOWN" | "POINTER_MOVE" | "POINTER_UP" | "POINTER_CANCEL"
>

export type KeyboardEditorEvent = Extract<EditorEvent, { type: "KEY_DOWN" }>

export type KeyboardEventType = Extract<EditorEventType, "KEY_DOWN">

export type Metrics = {
	lastRenderMs: number | null
	shapeCount: number
	eventsProcessed: number
	hitTests: number
}

export type DevLogEvent = {
	ts: number
	name: string
	data?: unknown
}

export type DebugState = {
	metrics: Metrics
	devLog: readonly DevLogEvent[]
}

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

export type Rect = {
	readonly id: ShapeId
	readonly x: number
	readonly y: number
	readonly width: number
	readonly height: number
}

export type DocumentState = {
	shapes: ReadonlyMap<ShapeId, Rect>
	shapeOrder: readonly ShapeId[]
}

export type EditorState = {
	doc: DocumentState
	session: SessionState
	debug: DebugState
}
