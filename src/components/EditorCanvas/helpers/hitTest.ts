import type {
	CanvasPoint,
	EditorState,
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
	state: EditorState,
	point: CanvasPoint,
): ShapeId | null {
	const t0 = performance.now()

	const { shapeOrder, shapes } = state.doc
	let hit: ShapeId | null = null

	for (let i = shapeOrder.length - 1; i >= 0; i--) {
		const id = shapeOrder[i]
		const shape = shapes.get(id)
		if (!shape) continue

		if (pointInRect(shape, point)) {
			hit = id
			break
		}
	}

	const t1 = performance.now()
	const metrics = state.debug.metrics
	metrics.hitTestMsLast = t1 - t0
	metrics.hitTests += 1

	return hit
}
