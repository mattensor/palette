import { commandReducer } from "@/components/EditorCanvas/reducer/commandReducer"
import type { InteractionResult } from "@/components/EditorCanvas/reducer/types"
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
	let interaction: InteractionResult
	switch (event.type) {
		case "KEY_DOWN":
			interaction = keyboardReducer(prev, event)
			break

		case "POINTER_DOWN":
		case "POINTER_MOVE":
		case "POINTER_UP":
		case "POINTER_CANCEL":
		case "FRAME_TICK":
			interaction = pointerReducer(prev, event)
			break

		case "SPAWN_SHAPES":
			interaction = commandReducer(prev, event)
			break

		default: {
			const _exhaustive: never = event
			throw new Error(`Unhandled event: ${JSON.stringify(_exhaustive)}`)
		}
	}

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
