import type { History } from "@/components/EditorCanvas/types"

export function historyFactory(overrides: Partial<History> = {}): History {
	return {
		past: [],
		future: [],
		...overrides,
	}
}
