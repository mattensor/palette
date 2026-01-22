import type {
	CanvasPoint,
	DocumentState,
	ShapeId,
} from "@/components/EditorCanvas/types"

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

export type DocEffectType = DocEffect["type"]

export type DocEffectByType = {
	[K in DocEffectType]: Extract<DocEffect, { type: K }>
}

export type DocEffectHandlerMap = {
	[K in DocEffectType]?: (
		prev: DocumentState,
		effect: DocEffectByType[K],
	) => DocumentState
}
