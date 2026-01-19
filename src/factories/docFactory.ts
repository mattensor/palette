import type { DocumentState } from "@/components/EditorCanvas/types"
import { rectFactory } from "@/factories/rectFactory"

export function docFactory(
	overrides: Partial<DocumentState> = {},
): DocumentState {
	const rect = rectFactory()

	return {
		shapes: new Map([[rect.id, rect]]),
		shapeOrder: [rect.id],
		...overrides,
	}
}
