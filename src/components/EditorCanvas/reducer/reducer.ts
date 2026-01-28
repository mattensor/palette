import { withDevLog } from "@/components/EditorCanvas/reducer/devLog"
import { docReducer } from "@/components/EditorCanvas/reducer/docReducer"
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

	const { session, debug, effects } = result
	const doc = effects.reduce(docReducer, prev.doc)

	let next: EditorState = {
		...prev,
		doc,
		session,
		debug,
	}

	if (doc !== prev.doc) {
		next = {
			...next,
			debug: {
				...next.debug,
				metrics: {
					...next.debug.metrics,
					shapeCount: doc.shapes.size,
				},
			},
		}
	}

	next = withDevLog({ prev, next, effects })

	return next
}
