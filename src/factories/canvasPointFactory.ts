import type { CanvasPoint } from "@/components/EditorCanvas/types"

export function canvasPointFactory(
	overrides: Partial<CanvasPoint> = {},
): CanvasPoint {
	return {
		x: 50,
		y: 50,
		...overrides,
	}
}
