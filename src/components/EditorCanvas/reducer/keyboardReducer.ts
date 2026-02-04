import { createRemoveRect } from "@/components/EditorCanvas/reducer/actions/createRemoveRect"
import type {
	EditorState,
	KeyboardEditorEvent,
} from "@/components/EditorCanvas/types"
import type { DocAction } from "@/components/EditorCanvas/types/actions"
import type { SessionState } from "@/components/EditorCanvas/types/interaction"
import type { InteractionResult } from "./types"

function noop(prev: EditorState): InteractionResult {
	return { session: prev.session, actions: [], perf: [] }
}

function withClearedSelection(prev: EditorState): SessionState {
	return { ...prev.session, selection: { kind: "none" } }
}

function deleteSelection(prev: EditorState): InteractionResult {
	if (prev.session.selection.kind === "none") return noop(prev)

	const action = createRemoveRect(prev.doc, prev.session.selection.id)

	return {
		session: withClearedSelection(prev),
		actions: action ? [action] : [],
		perf: [],
	}
}

export function keyboardReducer(
	prev: EditorState,
	event: KeyboardEditorEvent,
): InteractionResult {
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

		case "z": {
			const actionType: DocAction["type"] = event.modifiers.shift
				? "REDO"
				: "UNDO"

			return {
				session: withClearedSelection(prev),
				actions: [{ type: actionType }],
				perf: [],
			}
		}

		default:
			return noop(prev)
	}
}
