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
				lastRenderMs: null,
				shapeCount: 0,
				eventsProcessed: 0,
				hitTests: 0,
			},
			historyInfo: {
				depth: 0,
				canRedo: false,
				canUndo: false,
			},
			devLog: [],
		},
		frameInput: {
			latestPointerById: new Map(),
			lastFrameTs: null,
		},
	}
}
