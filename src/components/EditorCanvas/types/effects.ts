import type { CanvasPoint, DocumentState, ShapeId } from "./domain"

export type DocEffect =
	| {
			type: "COMMIT_DRAW_RECT"
			origin: CanvasPoint
			current: CanvasPoint
	  }
	| {
			type: "SET_SHAPE_POSITION"
			id: ShapeId
			x: number
			y: number
	  }
	| {
			type: "REMOVE_SHAPE"
			id: ShapeId
	  }

export type DocEffectType = DocEffect["type"]

export type DocEffectHandlerMap = {
	[K in DocEffectType]: (
		prev: DocumentState,
		effect: Extract<DocEffect, { type: K }>,
	) => DocumentState
}
