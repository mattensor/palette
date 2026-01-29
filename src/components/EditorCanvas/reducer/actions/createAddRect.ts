import { createShapeId } from "@/components/EditorCanvas/helpers/createShapeId"
import { normaliseRect } from "@/components/EditorCanvas/helpers/normaliseRect"
import type { CanvasPoint, DocAction } from "@/components/EditorCanvas/types"

export function createAddRect(
	origin: CanvasPoint,
	current: CanvasPoint,
): DocAction {
	const id = createShapeId()
	const rect = normaliseRect(origin, current, id)

	return {
		type: "COMMIT",
		patch: {
			type: "ADD_RECT",
			after: rect,
		},
	}
}
