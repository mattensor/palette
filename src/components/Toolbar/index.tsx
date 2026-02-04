import type { ReactNode } from "react"
import styles from "./styles.module.css"

export function Toolbar({ children }: { children: ReactNode }) {
	return (
		<div className={styles.toolbar} role="toolbar" aria-label="Editor toolbar">
			{children}
		</div>
	)
}

export function ToolbarButton({
	children,
	onClick,
	title,
}: {
	children: ReactNode
	onClick: () => void
	title?: string
}) {
	return (
		<button
			type="button"
			className={styles.button}
			onClick={onClick}
			title={title}
		>
			{children}
		</button>
	)
}
