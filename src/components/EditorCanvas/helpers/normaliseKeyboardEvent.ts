import type * as React from "react"
import type { EditorEvent, Key } from "@/components/EditorCanvas/types"

const KEYBOARD_TYPE_TO_EDITOR_EVENT_TYPE = {
	keydown: "KEY_DOWN",
} as const

const KEYBOARD_KEY_MAP = {
	Backspace: "Backspace",
	Delete: "Delete",
	Escape: "Escape",
	z: "z",
} as const satisfies Record<string, Key>

type KeyboardKeyType = keyof typeof KEYBOARD_KEY_MAP

type KeyDownEvent = Extract<EditorEvent, { type: "KEY_DOWN" }>
export function normaliseKeyboardEvent(
	event: React.KeyboardEvent<HTMLCanvasElement>,
): KeyDownEvent | null {
	if (!(event.type in KEYBOARD_TYPE_TO_EDITOR_EVENT_TYPE)) return null

	const rawKey = event.key.length === 1 ? event.key.toLowerCase() : event.key
	if (!(rawKey in KEYBOARD_KEY_MAP)) return null

	const key = KEYBOARD_KEY_MAP[event.key as KeyboardKeyType]
	if (!key) return null

	return {
		type: "KEY_DOWN",
		key,
		modifiers: {
			meta: event.metaKey,
			shift: event.shiftKey,
			alt: event.altKey,
			ctrl: event.ctrlKey,
		},
	}
}
