import type {
	DocAction,
	DocumentState,
	ShapeId,
} from "@/components/EditorCanvas/types"

export function createRemoveRect(
	doc: DocumentState,
	shapeId: ShapeId,
): DocAction | null {
	const shape = doc.shapes.get(shapeId)
	if (shape == null) return null

	return {
		type: "COMMIT",
		patch: {
			type: "REMOVE_RECT",
			before: shape,
		},
	}
}
