import type {
	KeyboardEditorEvent,
	Modifiers,
} from "@/components/EditorCanvas/types"

type KeyboardEventOverrides = Partial<Omit<KeyboardEditorEvent, "type">> & {
	type?: "KEY_DOWN"
}

const defaultModifiers: Modifiers = {
	meta: false,
	shift: false,
	alt: false,
	ctrl: false,
}

export function keyboardEventFactory(
	overrides: KeyboardEventOverrides = {},
): KeyboardEditorEvent {
	return {
		type: "KEY_DOWN",
		key: overrides.key ?? "Delete",
		modifiers: {
			...defaultModifiers,
			...overrides.modifiers,
		},
	}
}
