import type { DocAction } from "../types/actions"
import type { SessionState } from "../types/interaction"
import type { PerfEvent } from "../types/perf"

export type InteractionResult = {
	session: SessionState
	actions: DocAction[]
	perf: PerfEvent[]
}
