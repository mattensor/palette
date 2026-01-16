import type { EditorState, Rect } from "./types"

function drawRect(context: CanvasRenderingContext2D, rect: Rect) {
	context.beginPath()
	context.rect(rect.origin.x, rect.origin.y, rect.size.width, rect.size.height)
	context.fill()
}

export function render(canvas: HTMLCanvasElement, state: EditorState) {
	const context = canvas.getContext("2d")
	if (context == null) return

	for (const [_shapeId, shape] of state.doc.shapes) {
		drawRect(context, shape)
	}
}
