import { docReducer } from "@/components/EditorCanvas/reducer/docReducer"
import type {
	DocAction,
	DocPatch,
	EditorState,
} from "@/components/EditorCanvas/types"

function inversePatch(patch: DocPatch): DocPatch {
	switch (patch.type) {
		case "ADD_RECT":
			return { type: "REMOVE_RECT", before: patch.after }
		case "REMOVE_RECT":
			return { type: "ADD_RECT", after: patch.before }
		case "UPDATE_RECT":
			return {
				type: "UPDATE_RECT",
				id: patch.id,
				before: patch.after,
				after: patch.before,
			}
		default:
			throw new Error(`DocPatch not supported type:${patch}`)
	}
}

function undo(prev: EditorState): EditorState {
	const patch = prev.history.past.at(-1)
	if (!patch) return prev

	const inverse = inversePatch(patch)

	return {
		...prev,
		doc: docReducer(prev.doc, inverse),
		history: {
			...prev.history,
			past: prev.history.past.slice(0, -1),
			future: [...prev.history.future, patch],
		},
	}
}

function redo(prev: EditorState): EditorState {
	const patch = prev.history.future.at(-1)
	if (!patch) return prev

	return {
		...prev,
		doc: docReducer(prev.doc, patch),
		history: {
			...prev.history,
			past: [...prev.history.past, patch],
			future: prev.history.future.slice(0, -1),
		},
	}
}

export function historyReducer(
	prev: EditorState,
	action: DocAction,
): EditorState {
	switch (action.type) {
		case "COMMIT": {
			const patch = action.patch

			return {
				...prev,
				doc: docReducer(prev.doc, patch),
				history: {
					...prev.history,
					past: [...prev.history.past, patch],
					future: [], // invalidate past future history
				},
			}
		}
		case "UNDO":
			return undo(prev)
		case "REDO":
			return redo(prev)
		default:
			return prev
	}
}
