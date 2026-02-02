import type { CanvasPoint, PointerId, Rect, ShapeId } from "./domain"

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
			currentPointer: CanvasPoint
			startRect: Rect
	  }

export type Selection = { kind: "none" } | { kind: "shape"; id: ShapeId }
export type Hover = { kind: "none" } | { kind: "shape"; id: ShapeId }
export type LatestPointer =
	| { kind: "none" }
	| { kind: "some"; pointerId: PointerId; position: CanvasPoint }

export type SessionState = {
	mode: Mode
	selection: Selection
	hover: Hover
	latestPointer: LatestPointer
}
