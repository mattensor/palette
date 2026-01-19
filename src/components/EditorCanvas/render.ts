import { createShapeId } from "@/components/EditorCanvas/helpers/createShapeId"
import { normaliseRect } from "@/components/EditorCanvas/helpers/normaliseRect"
import type { EditorState, Rect } from "./types"

function drawRect(context: CanvasRenderingContext2D, rect: Rect) {
	context.beginPath()
	context.rect(rect.x, rect.y, rect.width, rect.height)
	context.fill()
}

function drawPreviewRect(
	context: CanvasRenderingContext2D,
	runtime: EditorState["session"],
) {
	const phase = runtime.mode
	if (phase.kind !== "drawingRect") return

	const tempRect = normaliseRect(phase.origin, phase.current, createShapeId())

	context.save()
	context.setLineDash([6, 4])
	context.strokeRect(tempRect.x, tempRect.y, tempRect.width, tempRect.height)
	context.restore()
}

export function render(canvas: HTMLCanvasElement, state: EditorState) {
	const context = canvas.getContext("2d")
	if (context == null) return

	context.clearRect(0, 0, canvas.width, canvas.height)

	drawPreviewRect(context, state.session)

	const doc = state.doc

	for (const shapeId of doc.shapeOrder) {
		const shape = doc.shapes.get(shapeId)
		if (shape == null) return

		drawRect(context, shape)
	}
}
