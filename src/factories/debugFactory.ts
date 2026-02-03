import type { DebugState } from "@/components/EditorCanvas/types"

export function debugFactory(overrides: Partial<DebugState> = {}): DebugState {
	return {
		metrics: {
			frameMsAvg: null,
			lastRenderMs: null,
			hitTestMsLast: null,
			hitTests: 0,
			queueLength: 0,
			movesDropped: 0,
			movesKept: 0,
			shapeCount: 0,
		},
		historyInfo: {
			depth: 0,
			canUndo: false,
			canRedo: false,
		},
		devLog: [],
		...overrides,
	}
}
