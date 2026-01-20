import { createPointerId } from "@/components/EditorCanvas/helpers/createPointerId"
import type { EditorEvent } from "@/components/EditorCanvas/types"

export function editorEventFactory(
	overrides: Partial<EditorEvent> = {},
): EditorEvent {
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
