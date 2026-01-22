import { normaliseRect } from "@/components/EditorCanvas/helpers/normaliseRect"
import type { EditorState, Rect, ShapeId } from "./types"

function strokeRectOutline(
	ctx: CanvasRenderingContext2D,
	rect: Rect,
	{ color, width }: { color: string; width: number },
) {
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

function drawRect(ctx: CanvasRenderingContext2D, rect: Rect) {
	ctx.beginPath()
	ctx.rect(rect.x, rect.y, rect.width, rect.height)
	ctx.fill()
}

function drawPreviewRect(
	ctx: CanvasRenderingContext2D,
	session: EditorState["session"],
) {
	const m = session.mode
	if (m.kind !== "drawingRect") return

	const tempRect = normaliseRect(m.origin, m.current, "__preview__" as ShapeId)

	ctx.save()
	ctx.setLineDash([6, 4])
	ctx.strokeRect(tempRect.x, tempRect.y, tempRect.width, tempRect.height)
	ctx.restore()
}

export function render(canvas: HTMLCanvasElement, state: EditorState) {
	const ctx = canvas.getContext("2d")
	if (!ctx) return

	ctx.clearRect(0, 0, canvas.width, canvas.height)

	const { doc, session } = state

	for (const id of doc.shapeOrder) {
		const rect = doc.shapes.get(id)
		if (!rect) continue
		drawRect(ctx, rect)
	}

	drawPreviewRect(ctx, session)

	const hoverId = session.hover.kind === "shape" ? session.hover.id : null
	const selectedId =
		session.selection.kind === "shape" ? session.selection.id : null

	if (hoverId && hoverId !== selectedId) {
		const rect = doc.shapes.get(hoverId)
		if (rect) strokeRectOutline(ctx, rect, { color: "yellow", width: 2 })
	}

	if (selectedId) {
		const rect = doc.shapes.get(selectedId)
		if (rect) strokeRectOutline(ctx, rect, { color: "blue", width: 2 })
	}
}
