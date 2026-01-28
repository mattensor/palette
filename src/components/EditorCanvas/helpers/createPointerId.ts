import type { PointerId } from "@/components/EditorCanvas/types"

export function createPointerId(raw: number): PointerId {
	return raw as PointerId
}
