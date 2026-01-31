import type {
	DocAction,
	DocPatch,
	EditorState,
} from "@/components/EditorCanvas/types"

export type DevLogName =
	| "session/mode_changed"
	| "session/hover_changed"
	| "session/selection_changed"
	| "history/commit"
	| "history/undo"
	| "history/redo"
	| "doc/rect_added"
	| "doc/rect_removed"
	| "doc/rect_updated"

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

function sameSelection(
	a: EditorState["session"]["selection"],
	b: EditorState["session"]["selection"],
): boolean {
	if (a.kind === "none" && b.kind === "none") return true
	if (a.kind === "shape" && b.kind === "shape") return a.id === b.id
	return false
}

function patchSummary(patch: DocPatch) {
	switch (patch.type) {
		case "ADD_RECT":
			return {
				type: patch.type,
				id: patch.after.id,
				after: patch.after,
			}
		case "REMOVE_RECT":
			return {
				type: patch.type,
				id: patch.before.id,
				before: patch.before,
			}
		case "UPDATE_RECT":
			return {
				type: patch.type,
				id: patch.id,
				before: patch.before,
				after: patch.after,
			}
		default:
			return patch satisfies never
	}
}

function logDocAction(next: EditorState, action: DocAction): EditorState {
	switch (action.type) {
		case "COMMIT": {
			const patch = action.patch

			let s = log(next, "history/commit", patchSummary(patch))

			switch (patch.type) {
				case "ADD_RECT":
					s = log(s, "doc/rect_added", {
						id: patch.after.id,
						rect: patch.after,
					})
					break
				case "REMOVE_RECT":
					s = log(s, "doc/rect_removed", {
						id: patch.before.id,
						rect: patch.before,
					})
					break
				case "UPDATE_RECT":
					s = log(s, "doc/rect_updated", {
						id: patch.id,
						before: patch.before,
						after: patch.after,
					})
					break
			}

			return s
		}

		case "UNDO":
			return log(next, "history/undo")

		case "REDO":
			return log(next, "history/redo")

		default:
			return next
	}
}

export function withDevLog(args: {
	prev: EditorState
	next: EditorState
	actions: readonly DocAction[]
}): EditorState {
	const { prev, actions } = args
	let next = args.next

	const fromMode = prev.session.mode.kind
	const toMode = next.session.mode.kind
	if (fromMode !== toMode) {
		next = log(next, "session/mode_changed", { from: fromMode, to: toMode })
	}

	if (!sameHover(prev.session.hover, next.session.hover)) {
		next = log(next, "session/hover_changed", {
			from: prev.session.hover,
			to: next.session.hover,
		})
	}

	if (!sameSelection(prev.session.selection, next.session.selection)) {
		next = log(next, "session/selection_changed", {
			from: prev.session.selection,
			to: next.session.selection,
		})
	}

	for (const action of actions) {
		next = logDocAction(next, action)
	}

	return next
}
