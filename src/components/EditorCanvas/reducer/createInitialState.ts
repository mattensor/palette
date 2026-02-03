import type { EditorState } from "@/components/EditorCanvas/types"

export function createInitialState(): EditorState {
	return {
		doc: {
			shapes: new Map(),
			shapeOrder: [],
		},
		history: {
			past: [],
			future: [],
		},
		session: {
			mode: { kind: "idle" },
			selection: { kind: "none" },
			hover: { kind: "none" },
			latestPointer: { kind: "none" },
		},
		debug: {
			metrics: {
				frameMsAvg: null,
				hitTestMsLast: null,
				hitTests: 0,
				lastRenderMs: null,
				movesDropped: 0,
				movesKept: 0,
				queueLength: 0,
				shapeCount: 0,
			},
			historyInfo: {
				depth: 0,
				canRedo: false,
				canUndo: false,
			},
			devLog: [],
		},
	}
}
