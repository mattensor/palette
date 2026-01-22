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

function SET_SHAPE_POSITION(
	prev: DocumentState,
	effect: DocEffectByType["SET_SHAPE_POSITION"],
): DocumentState {
	const shape = prev.shapes.get(effect.id)
	if (shape == null) return prev

	const updated = {
		...shape,
		x: effect.x,
		y: effect.y,
	}

	const shapes = new Map(prev.shapes)
	shapes.set(updated.id, updated)

	return {
		...prev,
		shapes,
	}
}

function REMOVE_SHAPE(
	prev: DocumentState,
	effect: DocEffectByType["REMOVE_SHAPE"],
): DocumentState {
	const shapes = new Map(prev.shapes)
	shapes.delete(effect.id)

	const shapeOrder = prev.shapeOrder.filter((shapeId) => shapeId !== effect.id)

	return {
		...prev,
		shapes,
		shapeOrder,
	}
}

const docEffectHandlers: HandlerMap = {
	COMMIT_DRAW_RECT,
	SET_SHAPE_POSITION,
	REMOVE_SHAPE,
}

export function docReducer(
	prev: DocumentState,
	effect: DocEffect,
): DocumentState {
	return docEffectHandlers[effect.type](prev, effect as never)
}
