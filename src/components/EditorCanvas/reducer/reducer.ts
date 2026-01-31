import { withDevLog } from "@/components/EditorCanvas/reducer/devLog"
import { historyReducer } from "@/components/EditorCanvas/reducer/historyReducer"
import { keyboardReducer } from "@/components/EditorCanvas/reducer/keyboardReducer"
import { pointerReducer } from "@/components/EditorCanvas/reducer/pointerReducer"
import type {
	EditorEvent,
	EditorState,
	KeyboardEditorEvent,
	PointerEditorEvent,
} from "@/components/EditorCanvas/types"

export function reducer(prev: EditorState, event: EditorEvent): EditorState {
	const result =
		event.type === "KEY_DOWN"
			? keyboardReducer(prev, event as KeyboardEditorEvent)
			: pointerReducer(prev, event as PointerEditorEvent)

	const { session, debug, actions } = result

	let next: EditorState = {
		...prev,
		session,
		debug,
	}

	next = actions.reduce(historyReducer, next)

	if (next.doc !== prev.doc) {
		next = {
			...next,
			debug: {
				...next.debug,
				metrics: {
					...next.debug.metrics,
					shapeCount: next.doc.shapes.size,
				},
			},
		}
	}

	next = withDevLog({ prev, next, actions })
	return next
}
