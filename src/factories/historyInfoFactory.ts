import type { History } from "@/components/EditorCanvas/types"

export function historyInfoFactory(history: History) {
	const pastLength = history.past.length
	const futureLength = history.future.length

	return {
		depth: pastLength + 1,
		canUndo: pastLength > 0,
		canRedo: futureLength > 0,
	}
}
