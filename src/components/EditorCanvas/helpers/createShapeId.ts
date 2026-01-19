import type { ShapeId } from "@/components/EditorCanvas/types"

export function createShapeId(): ShapeId {
	return crypto.randomUUID() as ShapeId
}
