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
	}
}
