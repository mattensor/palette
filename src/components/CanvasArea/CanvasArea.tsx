import type { CanvasHTMLAttributes } from "react"
import { forwardRef } from "react"
import styles from "./styles.module.css"

type Props = CanvasHTMLAttributes<HTMLCanvasElement>

export const CanvasArea = forwardRef<HTMLCanvasElement, Props>(
	({ className, ...props }, ref) => {
		return (
			<canvas
				ref={ref}
				className={`${styles.canvas} ${className ?? ""}`}
				{...props}
			>
				Interactive design editor for creating graphics
			</canvas>
		)
	},
)

CanvasArea.displayName = "CanvasArea"
