import type { DocPatch } from "@/components/EditorCanvas/types/actions"
import type { CanvasPoint, DocumentState, PointerId } from "./domain"
import type { SessionState } from "./interaction"

export type FrameInput = {
	latestPointerById: ReadonlyMap<PointerId, CanvasPoint>
	lastFrameTs: number | null
}

export type Metrics = {
	lastRenderMs: number | null
	shapeCount: number
	eventsProcessed: number
	hitTests: number
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
	frameInput: FrameInput
}
