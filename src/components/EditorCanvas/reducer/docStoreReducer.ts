import type {
	DocAction,
	DocPatch,
	DocumentState,
	ShapeId,
} from "@/components/EditorCanvas/types"

function applyPatch(prev: DocumentState, patch: DocPatch): DocumentState {
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

export function docStoreReducer(
	prev: DocumentState,
	action: DocAction,
): DocumentState {
	switch (action.type) {
		case "COMMIT":
			return applyPatch(prev, action.patch)
		case "UNDO":
			return prev
		case "REDO":
			return prev
		default:
			return prev
	}
}
