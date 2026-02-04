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
	const { shapeOrder, shapes } = doc

	for (let i = shapeOrder.length - 1; i >= 0; i--) {
		const id = shapeOrder[i]
		const shape = shapes.get(id)

		if (!shape) continue
		if (pointInRect(shape, point)) return id
	}

	return null
}
