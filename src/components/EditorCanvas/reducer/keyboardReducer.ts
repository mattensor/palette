import type { DocEffect } from "@/components/EditorCanvas/reducer/types"
import type {
	DebugState,
	EditorState,
	KeyboardEditorEvent,
	KeyboardEventType,
	SessionState,
} from "@/components/EditorCanvas/types"

type PointerResult = {
	session: SessionState
	debug: DebugState
	effects: DocEffect[]
}
type KeyboardEventHandler = (
	prev: EditorState,
	event: KeyboardEditorEvent,
) => PointerResult

function noop(prev: EditorState): PointerResult {
	return { session: prev.session, debug: prev.debug, effects: [] }
}

function KEY_DOWN(
	prev: EditorState,
	event: KeyboardEditorEvent,
): PointerResult {
	if (prev.session.selection.kind === "none") return noop(prev)

	// later refactor this to a map structure
	if (event.key === "Backspace" || event.key === "Delete") {
		const effect: DocEffect = {
			type: "REMOVE_SHAPE",
			id: prev.session.selection.id,
		}

		return {
			session: {
				...prev.session,
				selection: { kind: "none" },
			},
			debug: prev.debug,
			effects: [effect],
		}
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
