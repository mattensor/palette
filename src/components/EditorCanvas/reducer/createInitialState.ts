import type { EditorState } from "@/components/EditorCanvas/types"

export function createInitialState(): EditorState {
	return {
		doc: {
			shapes: new Map(),
			shapeOrder: [],
		},
		session: {
			mode: { kind: "idle" },
			selection: { kind: "none" },
			hover: { kind: "none" },
		},
		debug: {
			metrics: {
				lastRenderMs: null,
				shapeCount: 0,
			},
			devLog: [],
		},
	}
}
