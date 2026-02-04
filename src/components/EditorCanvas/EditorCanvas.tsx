import type { KeyboardEvent, PointerEvent } from "react"
import { useEffect, useRef, useState } from "react"
import { CanvasArea } from "@/components/CanvasArea"
import { type DebugSnapshot, DevPanel } from "@/components/DevPanel"
import { coalesceMoveEvents } from "@/components/EditorCanvas/helpers/coalesceMoveEvents"
import { normaliseKeyboardEvent } from "@/components/EditorCanvas/helpers/normaliseKeyboardEvent"
import { editorReducer } from "@/components/EditorCanvas/reducer"
import { createInitialState } from "@/components/EditorCanvas/reducer/createInitialState"
import type { EditorEvent } from "@/components/EditorCanvas/types"
import { createDebugRecorder } from "./debug/createDebugRecorder"
import { normalisePointerEvent } from "./helpers/normalisePointerEvent"
import { render } from "./render"
import styles from "./styles.module.css"

export function EditorCanvas() {
	const hostRef = useRef<HTMLDivElement>(null)
	const canvasRef = useRef<HTMLCanvasElement>(null)

	const eventQueueRef = useRef<EditorEvent[]>([])
	const frameScheduledRef = useRef(false)

	const coreRef = useRef(createInitialState())
	const debugRecorderRef = useRef(createDebugRecorder())

	const [debugSnapshot, setDebugSnapshot] = useState<DebugSnapshot>(() => ({
		mode: coreRef.current.session.mode,
		debug: debugRecorderRef.current.snapshot(coreRef.current),
	}))

	useEffect(() => {
		const id = window.setInterval(() => {
			const core = coreRef.current
			setDebugSnapshot({
				mode: core.session.mode,
				debug: debugRecorderRef.current.snapshot(core),
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
			render(canvas, coreRef.current)
		}

		const resizeObserver = new ResizeObserver(onResize)
		resizeObserver.observe(host)

		return () => resizeObserver.disconnect()
	}, [])

	function processFrame() {
		const frameStart = performance.now()
		const recorder = debugRecorderRef.current

		recorder.beginFrame()

		const eventsToProcess = eventQueueRef.current
		eventQueueRef.current = []

		const { events, movesDropped, movesKept, queueLength } =
			coalesceMoveEvents(eventsToProcess)

		recorder.recordMoveCoalesce({
			dropped: movesDropped,
			kept: movesKept,
			queueLength,
		})

		// process input events
		for (const event of events) {
			const prev = coreRef.current
			const { next, actions, perf } = editorReducer(prev, event)
			coreRef.current = next

			recorder.recordPerf(perf)
			recorder.recordTransition({ prev, next, actions })
		}

		// always do a frame tick

		const prev = coreRef.current
		const { next, actions, perf } = editorReducer(prev, {
			type: "FRAME_TICK",
			now: performance.now(),
		})
		coreRef.current = next

		recorder.recordPerf(perf)
		recorder.recordTransition({ prev, next, actions })

		const canvas = canvasRef.current
		if (canvas == null) return

		const beforeRender = performance.now()
		render(canvas, coreRef.current)
		const afterRender = performance.now()

		recorder.recordRender(afterRender - beforeRender)

		const frameEnd = performance.now()
		recorder.endFrame(frameEnd - frameStart)
	}

	function scheduleFrame() {
		if (frameScheduledRef.current === true) return
		frameScheduledRef.current = true

		requestAnimationFrame(() => {
			try {
				processFrame()
			} finally {
				frameScheduledRef.current = false
				if (eventQueueRef.current.length > 0) scheduleFrame()
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
		const canvas = canvasRef.current
		if (canvas == null) return
		const editorEvent = normaliseKeyboardEvent(e)
		if (editorEvent) enqueueEvent(editorEvent)
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
