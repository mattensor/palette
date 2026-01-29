import type { Rect, ShapeId } from "./domain"

export type DocPatch =
	| {
			type: "ADD_RECT"
			after: Rect
	  }
	| {
			type: "REMOVE_RECT"
			before: Rect
	  }
	| {
			type: "UPDATE_RECT"
			id: ShapeId
			before: Rect
			after: Rect
	  }

export type DocAction =
	| { type: "COMMIT"; patch: DocPatch }
	| { type: "UNDO" }
	| { type: "REDO" }
