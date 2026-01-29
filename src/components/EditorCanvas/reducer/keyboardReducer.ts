import { createRemoveRect } from "@/components/EditorCanvas/reducer/actions/createRemoveRect"
import type {
	DebugState,
	DocAction,
	EditorState,
	KeyboardEditorEvent,
	KeyboardEventType,
	SessionState,
} from "@/components/EditorCanvas/types"

type PointerResult = {
	session: SessionState
	debug: DebugState
	actions: DocAction[]
}
type KeyboardEventHandler = (
	prev: EditorState,
	event: KeyboardEditorEvent,
) => PointerResult

function noop(prev: EditorState): PointerResult {
	return { session: prev.session, debug: prev.debug, actions: [] }
}

function KEY_DOWN(
	prev: EditorState,
	event: KeyboardEditorEvent,
): PointerResult {
	if (prev.session.selection.kind === "none") return noop(prev)

	// later refactor this to a map structure
	if (event.key === "Backspace" || event.key === "Delete") {
		const action = createRemoveRect(prev.doc, prev.session.selection.id)

		return {
			session: {
				...prev.session,
				selection: { kind: "none" },
			},
			debug: prev.debug,
			actions: action ? [action] : [],
		}
	}

	if (event.key === "z") {
		console.log("pressed z", event.modifiers)
	}

	return noop(prev)
}

const keyboardEventHandlers: Record<KeyboardEventType, KeyboardEventHandler> = {
	KEY_DOWN,
}

export function keyboardReducer(
	prev: EditorState,
	event: KeyboardEditorEvent,
): PointerResult {
	const handler = keyboardEventHandlers[event.type]
	return handler ? handler(prev, event) : noop(prev)
}
