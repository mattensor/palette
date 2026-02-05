import type {
	DocumentState,
	EditorState,
} from "@/components/EditorCanvas/types"

export function createEmptyDocument(): DocumentState {
	return {
		shapes: new Map(),
		shapeOrder: [],
	}
}

export function createInitialState(): EditorState {
	return {
		doc: createEmptyDocument(),
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
