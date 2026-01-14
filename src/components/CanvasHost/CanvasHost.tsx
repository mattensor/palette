import type { PointerEvent } from "react"
import { useRef } from "react"
import { CanvasArea } from "@/components/CanvasArea"
import styles from "./styles.module.css"

export function CanvasHost() {
	const canvasRef = useRef<HTMLCanvasElement>(null)

	function onPointerDown(event: PointerEvent<HTMLCanvasElement>) {
		const canvas = canvasRef.current
		if (canvas == null) return

		const context = canvas.getContext("2d")
		if (context == null) return

		// canvas bounds in viewport coordinates
		const canvasRectangle = canvas.getBoundingClientRect()

		// ensure css pixles match device pixels
		const devicePixelRatio = window.devicePixelRatio || 1
		canvas.width = Math.floor(canvasRectangle.width * devicePixelRatio)
		canvas.height = Math.floor(canvasRectangle.height * devicePixelRatio)

		// ensure drawing is scaled
		context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)

		// pointer position in viewport coordinates
		const xClickPosition = event.clientX
		const yClickPosition = event.clientY

		// convert viewport → canvas coordinates
		const canvasXClickPosition = xClickPosition - canvasRectangle.left
		const canvasYClickPosition = yClickPosition - canvasRectangle.top

		// draw a dot at the pointer location
		context.beginPath()
		context.arc(canvasXClickPosition, canvasYClickPosition, 30, 0, Math.PI * 2)
		context.fill()
	}

	return (
		<div className={styles.canvasHost}>
			<CanvasArea ref={canvasRef} onPointerDown={onPointerDown} />
		</div>
	)
}
