import type { DebugState } from "@/components/EditorCanvas/types"

export function debugFactory(overrides: Partial<DebugState> = {}): DebugState {
	return {
		metrics: { lastRenderMs: null, shapeCount: 0 },
		devLog: [],
		...overrides,
	}
}
