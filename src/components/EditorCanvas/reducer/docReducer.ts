import { createShapeId } from "@/components/EditorCanvas/helpers/createShapeId"
import { normaliseRect } from "@/components/EditorCanvas/helpers/normaliseRect"
import type {
	DocEffect,
	DocEffectByType,
	DocEffectType,
} from "@/components/EditorCanvas/reducer/types"
import type { DocumentState } from "@/components/EditorCanvas/types"

type HandlerMap = {
	[K in DocEffectType]: (
		prev: DocumentState,
		effect: DocEffectByType[K],
	) => DocumentState
}

function COMMIT_DRAW_RECT(
	prev: DocumentState,
	effect: DocEffectByType["COMMIT_DRAW_RECT"],
): DocumentState {
	const id = createShapeId()
	const rect = normaliseRect(effect.origin, effect.current, id)

	const shapes = new Map(prev.shapes)
	shapes.set(rect.id, rect)

	return {
		...prev,
		shapes,
		shapeOrder: [...prev.shapeOrder, rect.id],
	}
}

function MOVE_SHAPE(
	prev: DocumentState,
	_effect: DocEffectByType["MOVE_SHAPE"],
): DocumentState {
	return prev
}

const docEffectHandlers: HandlerMap = {
	COMMIT_DRAW_RECT,
	MOVE_SHAPE,
}

export function docReducer(
	prev: DocumentState,
	effect: DocEffect,
): DocumentState {
	return docEffectHandlers[effect.type](prev, effect as never)
}
