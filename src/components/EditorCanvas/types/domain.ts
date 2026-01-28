export type CanvasPoint = { readonly x: number; readonly y: number }

type Brand<K, T extends string> = K & { readonly __brand: T }

export type PointerId = Brand<number, "PointerId">
export type ShapeId = Brand<string, "ShapeId">

export type Rect = {
	readonly id: ShapeId
	readonly x: number
	readonly y: number
	readonly width: number
	readonly height: number
}

export type DocumentState = {
	shapes: ReadonlyMap<ShapeId, Rect>
	shapeOrder: readonly ShapeId[]
}
