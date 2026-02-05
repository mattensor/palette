import type {
	DebugState,
	DevLogEvent,
	EditorState,
	HistoryInfo,
	Metrics,
} from "@/components/EditorCanvas/types"
import type { DocAction, DocPatch } from "../types/actions"
import type { PerfEvent } from "../types/perf"

const DEVLOG_MAX = 200

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

function assertNever(x: never): never {
	throw new Error(`Unexpected PerfEvent: ${JSON.stringify(x)}`)
}

function sameHover(
	a: EditorState["session"]["hover"],
	b: EditorState["session"]["hover"],
) {
	if (a.kind === "none" && b.kind === "none") return true
	if (a.kind === "shape" && b.kind === "shape") return a.id === b.id
	return false
}

function sameSelection(
	a: EditorState["session"]["selection"],
	b: EditorState["session"]["selection"],
) {
	if (a.kind === "none" && b.kind === "none") return true
	if (a.kind === "shape" && b.kind === "shape") return a.id === b.id
	return false
}

function historyInfoFrom(core: EditorState): HistoryInfo {
	const pastLength = core.history.past.length
	const futureLength = core.history.future.length
	return {
		depth: pastLength,
		canUndo: pastLength > 0,
		canRedo: futureLength > 0,
	}
}

function patchSummary(patch: DocPatch) {
	switch (patch.type) {
		case "ADD_RECT":
			return { type: patch.type, id: patch.after.id, after: patch.after }
		case "REMOVE_RECT":
			return { type: patch.type, id: patch.before.id, before: patch.before }
		case "UPDATE_RECT":
			return {
				type: patch.type,
				id: patch.id,
				before: patch.before,
				after: patch.after,
			}
		default:
			return patch as unknown as never
	}
}

function initialMetrics(): Metrics {
	return {
		frameMsAvg: null,
		frameMsLast: null,
		lastRenderMs: null,

		movesDropped: 0,
		queueLength: 0,

		hitTestsThisFrame: 0,

		shapeCount: 0,
	}
}

export type DebugRecorder = {
	beginFrame(): void
	recordMoveCoalesce(args: {
		dropped: number
		kept: number
		queueLength: number
	}): void
	recordPerf(events: readonly PerfEvent[]): void
	recordRender(ms: number): void
	endFrame(frameMsLast: number): void
	recordTransition(args: {
		prev: EditorState
		next: EditorState
		actions: readonly DocAction[]
	}): void
	snapshot(core: EditorState): DebugState
}

export function createDebugRecorder(): DebugRecorder {
	const metrics = initialMetrics()
	let devLog: DevLogEvent[] = []

	function pushLog(name: DevLogName, data?: unknown) {
		const entry: DevLogEvent = { ts: performance.now(), name, data }
		devLog.push(entry)
		if (devLog.length > DEVLOG_MAX) {
			devLog = devLog.slice(devLog.length - DEVLOG_MAX)
		}
	}

	return {
		beginFrame() {
			metrics.hitTestsThisFrame = 0
		},

		recordMoveCoalesce({ dropped, queueLength }) {
			metrics.movesDropped = dropped
			metrics.queueLength = queueLength
		},

		recordPerf(events) {
			for (const e of events) {
				switch (e.type) {
					case "HIT_TEST":
						metrics.hitTestsThisFrame += 1
						break
					default:
						assertNever(e as never)
				}
			}
		},

		recordRender(ms) {
			metrics.lastRenderMs = ms
		},

		endFrame(frameMsLast) {
			metrics.frameMsLast = frameMsLast

			const alpha = 0.1
			metrics.frameMsAvg =
				metrics.frameMsAvg == null
					? frameMsLast
					: metrics.frameMsAvg + alpha * (frameMsLast - metrics.frameMsAvg)
		},

		recordTransition({ prev, next, actions }) {
			const fromMode = prev.session.mode.kind
			const toMode = next.session.mode.kind
			if (fromMode !== toMode) {
				pushLog("session/mode_changed", { from: fromMode, to: toMode })
			}

			if (!sameHover(prev.session.hover, next.session.hover)) {
				pushLog("session/hover_changed", {
					from: prev.session.hover,
					to: next.session.hover,
				})
			}

			if (!sameSelection(prev.session.selection, next.session.selection)) {
				pushLog("session/selection_changed", {
					from: prev.session.selection,
					to: next.session.selection,
				})
			}

			for (const action of actions) {
				switch (action.type) {
					case "COMMIT": {
						const patch = action.patch
						pushLog("history/commit", patchSummary(patch))

						switch (patch.type) {
							case "ADD_RECT":
								pushLog("doc/rect_added", {
									id: patch.after.id,
									rect: patch.after,
								})
								break
							case "REMOVE_RECT":
								pushLog("doc/rect_removed", {
									id: patch.before.id,
									rect: patch.before,
								})
								break
							case "UPDATE_RECT":
								pushLog("doc/rect_updated", {
									id: patch.id,
									before: patch.before,
									after: patch.after,
								})
								break
						}
						break
					}

					case "UNDO":
						pushLog("history/undo")
						break
					case "REDO":
						pushLog("history/redo")
						break
				}
			}
		},

		snapshot(core) {
			metrics.shapeCount = core.doc.shapes.size

			return {
				metrics: { ...metrics },
				historyInfo: historyInfoFrom(core),
				devLog: [...devLog],
			}
		},
	}
}
