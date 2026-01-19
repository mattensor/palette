import type { PointerId } from "@/components/EditorCanvas/types"

export function createPointerId(raw: number): PointerId {
	return String(raw) as PointerId
}
