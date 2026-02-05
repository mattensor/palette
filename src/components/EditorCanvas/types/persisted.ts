export interface PersistedRectV1 {
	readonly id: string
	readonly x: number
	readonly y: number
	readonly width: number
	readonly height: number
}

export type EditorDocumentV1 = {
	version: 1
	shapes: readonly PersistedRectV1[]
	shapeOrder: readonly string[]
}
