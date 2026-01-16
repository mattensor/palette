export type Point = { readonly x: number; readonly y: number }
export type Size = { readonly width: number; readonly height: number }

export type EditorEvent =
	| {
			type: "POINTER_DOWN"
			pointerId: string
			position: Point
	  }
	| {
			type: "POINTER_MOVE"
			pointerId: string
			position: Point
	  }
	| {
			type: "POINTER_UP"
			pointerId: string
			position: Point
	  }
	| {
			type: "POINTER_CANCEL"
			pointerId: string
			position: Point
	  }

export type PointerPhase =
	| { kind: "idle" }
	| { kind: "dragging"; id: string; origin: Point; current: Point }

export type Rect = { id: string; origin: Point; size: Size }

export type EditorState = {
	doc: { shapes: ReadonlyMap<string, Rect> }
	runtime: { pointer: PointerPhase }
}
