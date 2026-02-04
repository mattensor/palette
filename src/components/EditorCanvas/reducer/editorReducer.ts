import type {
	DocAction,
	EditorEvent,
	EditorState,
} from "@/components/EditorCanvas/types"
import type { PerfEvent } from "../types/perf"
import { applyDocAction } from "./applyDocAction"
import { keyboardReducer } from "./keyboardReducer"
import { pointerReducer } from "./pointerReducer"

export type CoreReduceResult = {
	next: EditorState
	actions: readonly DocAction[]
	perf: readonly PerfEvent[]
}

export function editorReducer(
	prev: EditorState,
	event: EditorEvent,
): CoreReduceResult {
	const interaction =
		event.type === "KEY_DOWN"
			? keyboardReducer(prev, event)
			: pointerReducer(prev, event)

	let next: EditorState = {
		...prev,
		session: interaction.session,
	}

	for (const action of interaction.actions) {
		next = applyDocAction(next, action)
	}

	return {
		next,
		actions: interaction.actions,
		perf: interaction.perf,
	}
}
