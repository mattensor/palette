import { withDevLog } from "@/components/EditorCanvas/reducer/devLog"
import { docReducer } from "@/components/EditorCanvas/reducer/docReducer"
import { pointerReducer } from "@/components/EditorCanvas/reducer/pointerReducer"
import type { EditorEvent, EditorState } from "@/components/EditorCanvas/types"

export function reducer(prev: EditorState, event: EditorEvent): EditorState {
	const { session, effects } = pointerReducer(prev, event)

	const doc = effects.reduce(docReducer, prev.doc)

	let next: EditorState = {
		...prev,
		doc,
		session,
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
