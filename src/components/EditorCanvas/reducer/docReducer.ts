import type {
	DocPatch,
	DocumentState,
	ShapeId,
} from "@/components/EditorCanvas/types"

export function docReducer(
	prev: DocumentState,
	patch: DocPatch,
): DocumentState {
	switch (patch.type) {
		case "ADD_RECT": {
			const shapes = new Map(prev.shapes)
			const rect = patch.after
			shapes.set(rect.id, rect)

			return {
				...prev,
				shapes,
				shapeOrder: [...prev.shapeOrder, rect.id],
			}
		}

		case "UPDATE_RECT": {
			const shapes = new Map(prev.shapes)
			const rect = patch.after
			shapes.set(rect.id, rect)

			return {
				...prev,
				shapes,
			}
		}

		case "REMOVE_RECT": {
			const shapes = new Map(prev.shapes)
			shapes.delete(patch.before.id)

			const shapeOrder = prev.shapeOrder.filter(
				(shapeId: ShapeId) => shapeId !== patch.before.id,
			)

			return {
				...prev,
				shapes,
				shapeOrder,
			}
		}

		default:
			return prev
	}
}
