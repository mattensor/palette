import type { DebugState, Mode } from "@/components/EditorCanvas/types"
import styles from "./styles.module.css"

export type DebugSnapshot = {
	mode: Mode
	debug: DebugState
}

function formatMs(ms: number | null) {
	if (ms == null) return "—"
	return `${ms.toFixed(2)} ms`
}

export function DevPanel({ snapshot }: { snapshot: DebugSnapshot }) {
	const { mode, debug } = snapshot
	const logs = debug.devLog
	const lastLogs = logs.slice(Math.max(0, logs.length - 12))

	return (
		<div className={styles.panel}>
			<div className={styles.title}>Debug</div>

			<div className={styles.grid}>
				<div>mode</div>
				<div>{mode.kind}</div>

				<div>shapeCount</div>
				<div>{debug.metrics.shapeCount}</div>

				<div>lastRenderMs</div>
				<div>{formatMs(debug.metrics.lastRenderMs)}</div>
			</div>

			<div className={styles.sectionTitle}>devLog</div>

			<div className={styles.logList}>
				{lastLogs.length === 0 ? (
					<div className={styles.empty}>—</div>
				) : (
					lastLogs.map((e, idx) => {
						const prev = idx > 0 ? lastLogs[idx - 1] : null
						const delta = prev ? e.ts - prev.ts : null

						return (
							<div key={`${e.ts}-${idx}`} className={styles.logItem}>
								<div className={styles.logMeta}>
									<span className={styles.logTs}>{e.ts.toFixed(1)}</span>{" "}
									{delta != null && (
										<span className={styles.logDelta}>
											(+{delta.toFixed(1)}ms)
										</span>
									)}
								</div>
								<div className={styles.logName}>{e.name}</div>
							</div>
						)
					})
				)}
			</div>
		</div>
	)
}
