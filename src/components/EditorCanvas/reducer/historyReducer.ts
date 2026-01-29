import { docReducer } from "@/components/EditorCanvas/reducer/docReducer"
import type { DocAction, EditorState } from "@/components/EditorCanvas/types"

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
			return prev
		case "REDO":
			return prev
		default:
			return prev
	}
}
