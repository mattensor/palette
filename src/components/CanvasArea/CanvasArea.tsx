import type { RefObject } from "react"
import styles from "./styles.module.css"

interface Props {
  canvasRef: RefObject<HTMLCanvasElement | null>
}

export function CanvasArea({ canvasRef }: Props) {
  return (
    <canvas
      ref={canvasRef}
      className={styles.canvas}
    >
      Interactive design editor for creating graphics
    </canvas>
  )
}