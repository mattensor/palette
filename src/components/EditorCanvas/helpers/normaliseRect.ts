import type { Point, Rect } from "@/components/EditorCanvas/types"

export function normaliseRect(origin: Point, current: Point, id: string): Rect {
	const left = Math.min(origin.x, current.x)
	const top = Math.min(origin.y, current.y)

	const width = Math.abs(current.x - origin.x)
	const height = Math.abs(current.y - origin.y)

	return {
		id,
		origin: { x: left, y: top },
		size: { width, height },
	}
}
