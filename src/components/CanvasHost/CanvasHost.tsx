import { useRef, useEffect } from "react"
import { CanvasArea } from "../CanvasArea"
import styles from './styles.module.css'

export function CanvasHost() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef == null) return
  }, [])

  return (
    <div className={styles.canvasHost}>
      <CanvasArea canvasRef={canvasRef} />
    </div>
  )
}