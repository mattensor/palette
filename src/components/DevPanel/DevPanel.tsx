import type { DebugState, Mode } from "@/components/EditorCanvas/types"
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
}

function toLogRows(devLog: readonly { ts: number; name: string }[]): LogRow[] {
	return devLog.map((e, idx) => {
		const prev = idx > 0 ? devLog[idx - 1] : null
		const delta = prev ? e.ts - prev.ts : null

		return {
			key: `${e.ts}-${idx}`,
			tsText: e.ts.toFixed(1),
			deltaText: delta == null ? null : `(+${delta.toFixed(1)}ms)`,
			name: e.name,
		}
	})
}

export function DevPanel({ snapshot }: { snapshot: DebugSnapshot }) {
	const { mode, debug } = snapshot
	const { metrics, devLog } = debug

	const recentLogRows = toLogRows(getLastN(devLog, LOGS_TO_SHOW))

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
						</div>
					))
				)}
			</div>
		</div>
	)
}
