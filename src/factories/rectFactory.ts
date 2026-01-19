import { createShapeId } from "@/components/EditorCanvas/helpers/createShapeId"
import type { Rect } from "@/components/EditorCanvas/types"

export function rectFactory(overrides: Partial<Rect> = {}): Rect {
	return {
		id: createShapeId(),
		x: 0,
		y: 0,
		width: 175,
		height: 175,
		...overrides,
	}
}
