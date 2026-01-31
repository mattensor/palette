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

function getHistoryInfo(history: EditorState["history"]) {
	const pastLength = history.past.length
	const futureLength = history.future.length

	return {
		depth: pastLength,
		canUndo: pastLength > 0,
		canRedo: futureLength > 0,
	}
}

function undo(prev: EditorState): EditorState {
	const patch = prev.history.past.at(-1)
	if (!patch) return prev

	const inverse = inversePatch(patch)

	const history = {
		past: prev.history.past.slice(0, -1),
		future: [...prev.history.future, patch],
	}

	return {
		...prev,
		doc: docReducer(prev.doc, inverse),
		history,
		debug: {
			...prev.debug,
			historyInfo: getHistoryInfo(history),
		},
	}
}

function redo(prev: EditorState): EditorState {
	const patch = prev.history.future.at(-1)
	if (!patch) return prev

	const history = {
		past: [...prev.history.past, patch],
		future: prev.history.future.slice(0, -1),
	}

	return {
		...prev,
		doc: docReducer(prev.doc, patch),
		history,
		debug: {
			...prev.debug,
			historyInfo: getHistoryInfo(history),
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

			const history = {
				past: [...prev.history.past, patch],
				future: [], // invalidate future history
			}

			return {
				...prev,
				doc: docReducer(prev.doc, patch),
				history,
				debug: {
					...prev.debug,
					historyInfo: getHistoryInfo(history),
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
