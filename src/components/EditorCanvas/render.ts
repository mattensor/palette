import { normaliseRect } from "@/components/EditorCanvas/helpers/normaliseRect"
import type { DocumentState, EditorState, Mode, Rect, ShapeId } from "./types"

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

function deriveRenderableDoc(doc: DocumentState, mode: Mode): DocumentState {
	let shapes = doc.shapes

	if (mode.kind === "draggingSelection") {
		const dx = mode.currentPointer.x - mode.startPointer.x
		const dy = mode.currentPointer.y - mode.startPointer.y

		const moved: Rect = {
			...mode.startRect,
			x: mode.startRect.x + dx,
			y: mode.startRect.y + dy,
		}

		shapes = new Map([...shapes, [mode.shapeId, moved]])
		return { ...doc, shapes }
	}

	if (mode.kind === "drawingRect") {
		const previewId = "__preview__" as ShapeId
		const preview = normaliseRect(mode.origin, mode.current, previewId)

		shapes = new Map([...shapes, [previewId, preview]])

		const shapeOrder = doc.shapeOrder.includes(previewId)
			? doc.shapeOrder
			: [...doc.shapeOrder, previewId]

		return { ...doc, shapes, shapeOrder }
	}

	return doc
}

export function render(canvas: HTMLCanvasElement, state: EditorState) {
	const ctx = canvas.getContext("2d")
	if (!ctx) return

	ctx.clearRect(0, 0, canvas.width, canvas.height)

	const { doc, session } = state
	const renderDoc = deriveRenderableDoc(doc, session.mode)

	for (const id of renderDoc.shapeOrder) {
		const rect = renderDoc.shapes.get(id)
		if (!rect) continue

		if (
			id === ("__preview__" as ShapeId) &&
			session.mode.kind === "drawingRect"
		) {
			ctx.save()
			ctx.setLineDash([6, 4])
			ctx.strokeRect(rect.x, rect.y, rect.width, rect.height)
			ctx.restore()
			continue
		}

		drawRect(ctx, rect)
	}

	const hoverId = session.hover.kind === "shape" ? session.hover.id : null
	const selectedId =
		session.selection.kind === "shape" ? session.selection.id : null

	if (hoverId && hoverId !== selectedId) {
		const rect = renderDoc.shapes.get(hoverId)
		if (rect) strokeRectOutline(ctx, rect, { color: "yellow", width: 2 })
	}

	if (selectedId) {
		const rect = renderDoc.shapes.get(selectedId)
		if (rect) strokeRectOutline(ctx, rect, { color: "blue", width: 2 })
	}
}
