import { createShapeId } from "@/components/EditorCanvas/helpers/createShapeId"
import { normaliseRect } from "@/components/EditorCanvas/helpers/normaliseRect"
import type { EditorState, Rect, ShapeId } from "./types"

function drawHoverOutline(
	ctx: CanvasRenderingContext2D,
	sessionState: EditorState["session"],
	findShapeById: (id: ShapeId) => Rect | undefined,
	{ color = "yellow", width = 2 } = {},
) {
	if (sessionState.hover.kind === "none") return

	const rect = findShapeById(sessionState.hover.id)
	if (!rect) return

	const half = width / 2

	ctx.save()
	ctx.strokeStyle = color
	ctx.lineWidth = width
	ctx.strokeRect(
		rect.x - half,
		rect.y - half,
		rect.width + width,
		rect.height + width,
	)
	ctx.restore()
}
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

	const doc = state.doc

	for (const shapeId of doc.shapeOrder) {
		const shape = doc.shapes.get(shapeId)
		if (shape == null) continue

		drawRect(context, shape)
	}

	drawPreviewRect(context, state.session)
	drawHoverOutline(context, state.session, (id: ShapeId) => doc.shapes.get(id))
}
