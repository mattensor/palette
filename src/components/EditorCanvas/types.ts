export type CanvasPoint = { readonly x: number; readonly y: number }

type Brand<K, T extends string> = K & { readonly __brand: T }
export type PointerId = Brand<string, "PointerId">
export type ShapeId = Brand<string, "ShapeId">

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

export type EditorEventType = EditorEvent["type"]

export type Metrics = {
	lastFrameMs: number | null
	shapeCount: number
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

export type Mode =
	| { kind: "idle" }
	| {
			kind: "dragging"
			id: PointerId
			origin: CanvasPoint
			current: CanvasPoint
	  }

export type SessionState = {
	mode: Mode
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
}

export type EditorState = {
	doc: DocumentState
	session: SessionState
	debug: DebugState
}
