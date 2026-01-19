import type {
	CanvasPoint,
	DocumentState,
	Rect,
	ShapeId,
} from "@/components/EditorCanvas/types"

export function pointInRect(rect: Rect, point: CanvasPoint): boolean {
	return (
		point.x >= rect.x &&
		point.x <= rect.x + rect.width &&
		point.y >= rect.y &&
		point.y <= rect.y + rect.height
	)
}

export function hitTestTopmostShape(
	doc: DocumentState,
	point: CanvasPoint,
): ShapeId | null {
	for (let i = doc.shapes.size - 1; i >= 0; i--) {
		const shapeId = doc.shapeOrder[i]
		const shape = doc.shapes.get(shapeId)

		if (!shape) continue
		if (pointInRect(shape, point)) return shapeId
	}

	return null
}
