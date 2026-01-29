import type {
	DocAction,
	DocumentState,
	ShapeId,
} from "@/components/EditorCanvas/types"

export function createUpdateRectPosition(
	doc: DocumentState,
	shapeId: ShapeId,
	position: { x: number; y: number },
): DocAction | null {
	const shape = doc.shapes.get(shapeId)
	if (shape == null) return null

	const updated = {
		...shape,
		x: position.x,
		y: position.y,
	}

	return {
		type: "COMMIT",
		patch: {
			type: "UPDATE_RECT",
			id: shapeId,
			before: shape,
			after: updated,
		},
	}
}
