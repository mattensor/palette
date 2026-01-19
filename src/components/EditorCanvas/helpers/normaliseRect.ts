import type {
	CanvasPoint,
	Rect,
	ShapeId,
} from "@/components/EditorCanvas/types"

export function normaliseRect(
	origin: CanvasPoint,
	current: CanvasPoint,
	id: ShapeId,
): Rect {
	const left = Math.min(origin.x, current.x)
	const top = Math.min(origin.y, current.y)

	const width = Math.abs(current.x - origin.x)
	const height = Math.abs(current.y - origin.y)

	return {
		id,
		x: left,
		y: top,
		width,
		height,
	}
}
