import type { DocPatch } from "@/components/EditorCanvas/types/effects"
import type { DocumentState } from "./domain"
import type { SessionState } from "./interaction"

export type Metrics = {
	lastRenderMs: number | null
	shapeCount: number
	eventsProcessed: number
	hitTests: number
}

export type DevLogEvent = {
	ts: number
	name: string
	data?: unknown
}

export type DebugState = {
	metrics: Metrics
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
