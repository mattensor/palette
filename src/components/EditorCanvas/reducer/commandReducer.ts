import { createShapeId } from "@/components/EditorCanvas/helpers/createShapeId"
import type { InteractionResult } from "@/components/EditorCanvas/reducer/types"
import type {
	EditorEvent,
	EditorState,
	Rect,
} from "@/components/EditorCanvas/types"

function noop(prev: EditorState): InteractionResult {
	return { session: prev.session, actions: [], perf: [] }
}

function createRandomRects(count: number): Rect[] {
	const rects = new Array<Rect>(count)

	let seed = (performance.now() | 0) ^ (count << 8)
	const rand = () => {
		seed = (seed * 1664525 + 1013904223) | 0
		return ((seed >>> 0) % 1_000_000) / 1_000_000
	}

	for (let i = 0; i < count; i++) {
		const x = 50 + rand() * 800
		const y = 50 + rand() * 500
		const width = 10 + rand() * 60
		const height = 10 + rand() * 60

		rects[i] = {
			id: createShapeId(),
			x,
			y,
			width,
			height,
		}
	}

	return rects
}

export function commandReducer(
	prev: EditorState,
	event: EditorEvent,
): InteractionResult {
	switch (event.type) {
		case "SPAWN_SHAPES": {
			const count = Math.max(0, Math.floor(event.count))
			const rects = createRandomRects(count)

			return {
				session: prev.session,
				actions: [
					{ type: "COMMIT", patch: { type: "ADD_RECTS", after: rects } },
				],
				perf: [],
			} as const
		}
		default:
			return noop(prev)
	}
}
