import type { KeyboardEvent, PointerEvent } from "react"
import { useEffect, useRef, useState } from "react"
import { CanvasArea } from "@/components/CanvasArea"
import { type DebugSnapshot, DevPanel } from "@/components/DevPanel"
import type { EditorEvent } from "@/components/EditorCanvas/types"
import {
	normaliseKeyboardEvent,
	normalisePointerEvent,
} from "./helpers/normalisePointerEvent"
import { createInitialState, reducer } from "./reducer"
import { render } from "./render"
import styles from "./styles.module.css"

export function EditorCanvas() {
	const hostRef = useRef<HTMLDivElement>(null)
	const canvasRef = useRef<HTMLCanvasElement>(null)

	const eventQueueRef = useRef<EditorEvent[]>([])
	const frameScheduledRef = useRef(false)

	const editorStateRef = useRef(createInitialState())

	const [debugSnapshot, setDebugSnapshot] = useState<DebugSnapshot>(() => ({
		mode: editorStateRef.current.session.mode,
		debug: editorStateRef.current.debug,
	}))

	useEffect(() => {
		const id = window.setInterval(() => {
			const s = editorStateRef.current
			// Shallow snapshot is enough since we're replacing state in the reducer.
			setDebugSnapshot({
				mode: s.session.mode,
				debug: s.debug,
			})
		}, 100)

		return () => window.clearInterval(id)
	}, [])

	useEffect(() => {
		const host = hostRef.current
		if (host == null) return

		function onResize(_entries: ResizeObserverEntry[]) {
			const canvas = canvasRef.current
			if (canvas == null) return

			const context = canvas.getContext("2d")
			if (context == null) return

			const canvasRectangle = canvas.getBoundingClientRect()

			const devicePixelRatio = window.devicePixelRatio || 1
			canvas.width = Math.floor(canvasRectangle.width * devicePixelRatio)
			canvas.height = Math.floor(canvasRectangle.height * devicePixelRatio)

			context.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0)
			render(canvas, editorStateRef.current)
		}

		const resizeObserver = new ResizeObserver(onResize)

		resizeObserver.observe(host)

		return () => {
			resizeObserver.disconnect()
		}
	}, [])

	function processFrame() {
		const eventsToProcess = eventQueueRef.current
		eventQueueRef.current = []

		for (const event of eventsToProcess) {
			const prev = editorStateRef.current
			editorStateRef.current = reducer(prev, event)
		}

		const canvas = canvasRef.current
		if (canvas == null) return

		const before = performance.now()
		render(canvas, editorStateRef.current)
		const after = performance.now()

		// mutate in place to avoid updating editor state every frame
		editorStateRef.current.debug.metrics.lastRenderMs = after - before
	}

	function scheduleFrame() {
		if (frameScheduledRef.current === true) return

		frameScheduledRef.current = true

		requestAnimationFrame(() => {
			try {
				processFrame()
			} finally {
				frameScheduledRef.current = false

				if (eventQueueRef.current.length > 0) {
					scheduleFrame()
				}
			}
		})
	}

	function enqueueEvent(event: EditorEvent) {
		eventQueueRef.current.push(event)
		scheduleFrame()
	}

	function handlePointerEvent(event: PointerEvent<HTMLCanvasElement>) {
		const canvas = canvasRef.current
		if (canvas == null) return

		const editorEvent = normalisePointerEvent(event, canvas)
		enqueueEvent(editorEvent)
	}

	function handlePointerDown(e: PointerEvent<HTMLCanvasElement>) {
		e.currentTarget.setPointerCapture(e.pointerId)
		handlePointerEvent(e)
	}

	function handlePointerUp(e: PointerEvent<HTMLCanvasElement>) {
		handlePointerEvent(e)
		e.currentTarget.releasePointerCapture(e.pointerId)
	}

	function handlePointerCancel(e: PointerEvent<HTMLCanvasElement>) {
		handlePointerEvent(e)
		try {
			e.currentTarget.releasePointerCapture(e.pointerId)
		} catch {}
	}

	function handleKeyDown(e: KeyboardEvent<HTMLCanvasElement>) {
		if (e.key === "Delete" || e.key === "Backspace") {
			const canvas = canvasRef.current
			if (canvas == null) return

			const editorEvent = normaliseKeyboardEvent(e)
			if (editorEvent) enqueueEvent(editorEvent)
		}
	}

	return (
		<div ref={hostRef} className={styles.canvasHost}>
			<CanvasArea
				tabIndex={0}
				ref={canvasRef}
				onPointerDown={handlePointerDown}
				onPointerMove={handlePointerEvent}
				onPointerUp={handlePointerUp}
				onPointerCancel={handlePointerCancel}
				onKeyDown={handleKeyDown}
			/>
			<DevPanel snapshot={debugSnapshot} />
		</div>
	)
}
