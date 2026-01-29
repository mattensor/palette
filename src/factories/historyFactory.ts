import type { History } from "@/components/EditorCanvas/types"
import { docPatchFactory } from "@/factories/docPatchFactory"
import { rectFactory } from "@/factories/rectFactory"

export function historyFactory(overrides: Partial<History> = {}): History {
	return {
		past: [],
		future: [],
		...overrides,
	}
}

export function historyWithOnePastFactory(
	overrides: Partial<History> = {},
): History {
	const rect = rectFactory()
	const patch = docPatchFactory.addRect(rect)
	return {
		past: [patch],
		future: [],
		...overrides,
	}
}
