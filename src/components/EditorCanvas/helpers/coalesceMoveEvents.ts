import type { EditorEvent, PointerId } from "@/components/EditorCanvas/types"

type CoalesceResult = {
	events: EditorEvent[]
	movesDropped: number
	movesKept: number
	queueLength: number
}

export function coalesceMoveEvents(events: EditorEvent[]): CoalesceResult {
	const queue: EditorEvent[] = []
	const lastMoveEventByPointerId = new Map<PointerId, EditorEvent>()
	let movesSeen = 0

	for (const event of events) {
		if (event.type === "POINTER_MOVE") {
			movesSeen++
			lastMoveEventByPointerId.set(event.pointerId, event)
			continue
		}
		queue.push(event)
	}

	for (const moveEvent of lastMoveEventByPointerId.values()) {
		queue.push(moveEvent)
	}

	return {
		events: queue,
		movesDropped: movesSeen - lastMoveEventByPointerId.size,
		movesKept: lastMoveEventByPointerId.size,
		queueLength: events.length,
	}
}
