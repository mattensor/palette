import type { DocPatch } from "@/components/EditorCanvas/types/actions"
import type { DocumentState } from "./domain"
import type { SessionState } from "./interaction"

export type Metrics = {
	lastRenderMs: number | null
	shapeCount: number
	hitTests: number
	movesKept: number
	movesDropped: number
	queueLength: number // raw input
}

export type HistoryInfo = {
	depth: number
	canUndo: boolean
	canRedo: boolean
}

export type DevLogEvent = {
	ts: number
	name: string
	data?: unknown
}

export type DebugState = {
	metrics: Metrics
	historyInfo: HistoryInfo
	devLog: readonly DevLogEvent[]
}

export type History = {
	past: readonly DocPatch[]
	future: readonly DocPatch[]
}

export type EditorState = {
	doc: DocumentState
	session: SessionState
	history: History
	debug: DebugState
}
