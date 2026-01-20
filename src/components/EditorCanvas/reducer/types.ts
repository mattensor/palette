import type {
	CanvasPoint,
	Rect,
	ShapeId,
} from "@/components/EditorCanvas/types"

export type DocEffect =
	| { type: "DOC/ADD_RECT"; rect: Rect }
	| { type: "DOC/MOVE_SHAPE"; id: ShapeId; x: CanvasPoint; y: CanvasPoint }
