export type Metrics = {
	// frame health
	frameMsLast: number | null
	frameMsAvg: number | null
	lastRenderMs: number | null

	// input pressure
	queueLength: number
	movesDropped: number

	// scale signals
	shapeCount: number
	hitTestsThisFrame: number
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
