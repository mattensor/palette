import type {
	DocumentState,
	EditorDocumentV1,
	PersistedRectV1,
	Rect,
	ShapeId,
} from "@/components/EditorCanvas/types"

const DOCUMENT_VERSION = 1

const toShapeId = (id: string) => id as ShapeId
const toIdString = (id: ShapeId) => id as unknown as string

const toPersistedRect = (r: Rect): PersistedRectV1 => ({
	id: toIdString(r.id),
	x: r.x,
	y: r.y,
	width: r.width,
	height: r.height,
})

const fromPersistedRect = (s: PersistedRectV1): [ShapeId, Rect] => {
	const id = toShapeId(s.id)
	return [id, { id, x: s.x, y: s.y, width: s.width, height: s.height }]
}

export function toPersisted(doc: DocumentState): EditorDocumentV1 {
	return {
		version: DOCUMENT_VERSION,
		shapes: Array.from(doc.shapes.values(), toPersistedRect),
		shapeOrder: doc.shapeOrder.map(toIdString),
	}
}

export function fromPersisted(persisted: EditorDocumentV1): DocumentState {
	return {
		shapes: new Map(persisted.shapes.map(fromPersistedRect)),
		shapeOrder: persisted.shapeOrder.map(toShapeId),
	}
}
