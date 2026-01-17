import type { EditorState, Rect } from "./types"

function drawRect(context: CanvasRenderingContext2D, rect: Rect) {
	context.beginPath()
	context.rect(rect.origin.x, rect.origin.y, rect.size.width, rect.size.height)
	context.fill()
}

function drawPreviewRect(
	context: CanvasRenderingContext2D,
	runtime: EditorState["runtime"],
) {
	const phase = runtime.pointer
	if (phase.kind !== "dragging") return

	context.save()
	context.setLineDash([6, 4])
	context.strokeRect(
		phase.origin.x,
		phase.origin.y,
		phase.current.x - phase.origin.x,
		phase.current.y - phase.origin.y,
	)
	context.restore()
}

export function render(canvas: HTMLCanvasElement, state: EditorState) {
	const context = canvas.getContext("2d")
	if (context == null) return

	context.clearRect(0, 0, canvas.width, canvas.height)

	drawPreviewRect(context, state.runtime)

	for (const [_shapeId, shape] of state.doc.shapes) {
		drawRect(context, shape)
	}
}
