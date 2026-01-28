import { createPointerId } from "@/components/EditorCanvas/helpers/createPointerId"
import type { PointerEditorEvent } from "@/components/EditorCanvas/types"

export function pointerEventFactory(
	overrides: Partial<PointerEditorEvent> = {},
): PointerEditorEvent {
	return {
		type: "POINTER_DOWN",
		pointerId: createPointerId(123),
		position: {
			x: 10,
			y: 10,
		},
		...overrides,
	}
}
