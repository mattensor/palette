import { createRemoveRect } from "@/components/EditorCanvas/reducer/actions/createRemoveRect"
import type {
	DebugState,
	DocAction,
	EditorState,
	KeyboardEditorEvent,
	SessionState,
} from "@/components/EditorCanvas/types"

export type KeyboardResult = {
	session: SessionState
	debug: DebugState
	actions: DocAction[]
}

function noop(prev: EditorState): KeyboardResult {
	return { session: prev.session, debug: prev.debug, actions: [] }
}

function withClearedSelection(prev: EditorState): SessionState {
	return { ...prev.session, selection: { kind: "none" } }
}

function deleteSelection(prev: EditorState): KeyboardResult {
	if (prev.session.selection.kind === "none") return noop(prev)

	const action = createRemoveRect(prev.doc, prev.session.selection.id)

	return {
		session: withClearedSelection(prev),
		debug: prev.debug,
		actions: action ? [action] : [],
	}
}

export function keyboardReducer(
	prev: EditorState,
	event: KeyboardEditorEvent,
): KeyboardResult {
	switch (event.type) {
		case "KEY_DOWN":
			break
		default:
			return noop(prev)
	}

	switch (event.key) {
		case "Backspace":
		case "Delete":
			return deleteSelection(prev)

		default:
			return noop(prev)
	}
}
