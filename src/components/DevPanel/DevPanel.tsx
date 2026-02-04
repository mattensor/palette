import type {
	DebugState,
	DevLogEvent,
} from "@/components/EditorCanvas/types/debug"
import type { Mode } from "@/components/EditorCanvas/types/interaction"
import styles from "./styles.module.css"

export type DebugSnapshot = {
	mode: Mode
	debug: DebugState
}

const LOGS_TO_SHOW = 12

function formatMs(ms: number | null) {
	return ms == null ? "—" : `${ms.toFixed(2)} ms`
}

function getLastN<T>(items: readonly T[], n: number): readonly T[] {
	return items.slice(Math.max(0, items.length - n))
}

type LogRow = {
	key: string
	tsText: string
	deltaText: string | null
	name: string
	detailText: string | null
}

function safeStringify(value: unknown): string | null {
	if (value == null) return null
	try {
		return JSON.stringify(value)
	} catch {
		return "[data]"
	}
}

function toLogRows(devLog: readonly DevLogEvent[]): LogRow[] {
	return devLog.map((e, idx) => {
		const prev = idx > 0 ? devLog[idx - 1] : null
		const delta = prev ? e.ts - prev.ts : null

		return {
			key: `${e.ts}-${idx}`,
			tsText: e.ts.toFixed(1),
			deltaText: delta == null ? null : `(+${delta.toFixed(1)}ms)`,
			name: e.name,
			detailText: safeStringify(e.data),
		}
	})
}

export function DevPanel({ snapshot }: { snapshot: DebugSnapshot }) {
	const { mode, debug } = snapshot
	const { metrics, devLog, historyInfo } = debug

	const recent = getLastN(devLog, LOGS_TO_SHOW)
	const recentLogRows = toLogRows(recent).reverse()

	return (
		<div className={styles.panel}>
			<div className={styles.title}>Debug</div>

			<div className={styles.grid}>
				<div>mode</div>
				<div>{mode.kind}</div>

				<div>shapeCount</div>
				<div>{metrics.shapeCount}</div>

				<div>lastRenderMs</div>
				<div>{formatMs(metrics.lastRenderMs)}</div>

				<div>frameMsLast</div>
				<div>{formatMs(metrics.frameMsLast)}</div>

				<div>frameMsAvg</div>
				<div>{formatMs(metrics.frameMsAvg)}</div>

				<div>queueLength</div>
				<div>{metrics.queueLength}</div>

				<div>movesDropped</div>
				<div>{metrics.movesDropped}</div>

				<div>hitTestsThisFrame</div>
				<div>{metrics.hitTestsThisFrame}</div>
			</div>

			<div className={styles.sectionTitle}>history</div>

			<div className={styles.grid}>
				<div>depth</div>
				<div>{historyInfo.depth}</div>

				<div>canUndo</div>
				<div>{historyInfo.canUndo ? "true" : "false"}</div>

				<div>canRedo</div>
				<div>{historyInfo.canRedo ? "true" : "false"}</div>
			</div>

			<div className={styles.sectionTitle}>devLog</div>

			<div className={styles.logList}>
				{recentLogRows.length === 0 ? (
					<div className={styles.empty}>—</div>
				) : (
					recentLogRows.map((row) => (
						<div key={row.key} className={styles.logItem}>
							<div className={styles.logMeta}>
								<span className={styles.logTs}>{row.tsText}</span>{" "}
								{row.deltaText != null && (
									<span className={styles.logDelta}>{row.deltaText}</span>
								)}
							</div>

							<div className={styles.logName}>{row.name}</div>

							{row.detailText != null && (
								<div className={styles.logDetail}>{row.detailText}</div>
							)}
						</div>
					))
				)}
			</div>
		</div>
	)
}
