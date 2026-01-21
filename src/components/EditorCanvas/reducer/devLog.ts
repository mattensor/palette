import type { DocEffect } from "@/components/EditorCanvas/reducer/types"
import type { EditorState } from "@/components/EditorCanvas/types"

export type DevLogName =
	| "session/mode_changed"
	| "session/hover_changed"
	| "doc/rect_added"

export type DevLogEntry = {
	ts: number
	name: DevLogName
	data?: unknown
}

const DEVLOG_MAX = 200

function pushDevLog(prev: EditorState, entry: DevLogEntry): EditorState {
	const next = [...prev.debug.devLog, entry]
	const capped =
		next.length > DEVLOG_MAX ? next.slice(next.length - DEVLOG_MAX) : next

	return {
		...prev,
		debug: {
			...prev.debug,
			devLog: capped,
		},
	}
}

function log(
	state: EditorState,
	name: DevLogName,
	data?: unknown,
): EditorState {
	return pushDevLog(state, {
		ts: performance.now(),
		name,
		data,
	})
}

function sameHover(
	a: EditorState["session"]["hover"],
	b: EditorState["session"]["hover"],
): boolean {
	if (a.kind === "none" && b.kind === "none") return true
	if (a.kind === "shape" && b.kind === "shape") return a.id === b.id
	return false
}

/**
 * Day 2 logging rules:
 * - log session/mode_changed when mode.kind changes
 * - log session/hover_changed when hover target changes
 * - log doc/rect_added when draw intent commits
 *
 * Intentionally logs intent, not geometry.
 */
export function withDevLog(args: {
	prev: EditorState
	next: EditorState
	effects: readonly DocEffect[]
}): EditorState {
	const { prev, effects } = args
	let next = args.next

	// mode change
	const fromMode = prev.session.mode.kind
	const toMode = next.session.mode.kind
	if (fromMode !== toMode) {
		next = log(next, "session/mode_changed", {
			from: fromMode,
			to: toMode,
		})
	}

	// hover change
	if (!sameHover(prev.session.hover, next.session.hover)) {
		next = log(next, "session/hover_changed", {
			from: prev.session.hover,
			to: next.session.hover,
		})
	}

	// document intents
	for (const effect of effects) {
		if (effect.type === "COMMIT_DRAW_RECT") {
			next = log(next, "doc/rect_added", {
				origin: effect.origin,
				current: effect.current,
			})
		}
	}

	return next
}
