import { describe, expect, it } from "vitest"
import { docReducer } from "@/components/EditorCanvas/reducer/docReducer"
import type {
	DocumentState,
	Rect,
	ShapeId,
} from "@/components/EditorCanvas/types"

const createShapeIdT = (s: string) => s as ShapeId

function createDocState(overrides?: Partial<DocumentState>): DocumentState {
	return {
		shapes: new Map(),
		shapeOrder: [],
		...overrides,
	}
}

describe("docReducer", () => {
	describe("ADD_RECT", () => {
		it("inserts rect into shapes and appends id to shapeOrder (immutably)", () => {
			const id = createShapeIdT("shape-1")
			const rect: Rect = { id, x: 10, y: 20, width: 30, height: 40 }

			const prev = createDocState()

			const next = docReducer(prev, {
				type: "ADD_RECT",
				after: rect,
			} as any)

			// immutability
			expect(next).not.toBe(prev)
			expect(next.shapes).not.toBe(prev.shapes)
			expect(next.shapeOrder).not.toBe(prev.shapeOrder)

			// contents
			expect(next.shapes.get(id)).toEqual(rect)
			expect(next.shapeOrder).toEqual([id])
		})

		it("preserves existing shapes/order and appends new id", () => {
			const existingId = createShapeIdT("shape-existing")
			const existingRect: Rect = {
				id: existingId,
				x: 0,
				y: 0,
				width: 1,
				height: 1,
			}

			const prev = createDocState({
				shapes: new Map([[existingId, existingRect]]),
				shapeOrder: [existingId],
			})

			const newId = createShapeIdT("shape-new")
			const newRect: Rect = { id: newId, x: 5, y: 6, width: 7, height: 8 }

			const next = docReducer(prev, {
				type: "ADD_RECT",
				after: newRect,
			} as any)

			expect(next.shapes.get(existingId)).toEqual(existingRect)
			expect(next.shapes.get(newId)).toEqual(newRect)
			expect(next.shapeOrder).toEqual([existingId, newId])
		})
	})

	describe("UPDATE_RECT", () => {
		it("updates rect in shapes without changing shapeOrder (immutably)", () => {
			const id = createShapeIdT("shape-1")
			const rect: Rect = { id, x: 10, y: 20, width: 3, height: 4 }

			const prev = createDocState({
				shapes: new Map([[id, rect]]),
				shapeOrder: [id],
			})

			const updated: Rect = { ...rect, x: 111, y: 222 }

			const next = docReducer(prev, {
				type: "UPDATE_RECT",
				after: updated,
			} as any)

			expect(next).not.toBe(prev)
			expect(next.shapes).not.toBe(prev.shapes)
			expect(next.shapeOrder).toBe(prev.shapeOrder) // reducer doesn't touch order for update

			expect(next.shapes.get(id)).toEqual(updated)
		})

		it("adds the rect if it didn't exist yet (since reducer uses shapes.set)", () => {
			const id = createShapeIdT("missing")
			const rect: Rect = { id, x: 1, y: 2, width: 3, height: 4 }

			const prev = createDocState()

			const next = docReducer(prev, {
				type: "UPDATE_RECT",
				after: rect,
			} as any)

			expect(next).not.toBe(prev)
			expect(next.shapes.get(id)).toEqual(rect)
			expect(next.shapeOrder).toEqual([]) // order unchanged by UPDATE_RECT
		})
	})

	describe("REMOVE_RECT", () => {
		it("deletes rect from shapes and removes id from shapeOrder (immutably)", () => {
			const id1 = createShapeIdT("shape-1")
			const id2 = createShapeIdT("shape-2")

			const r1: Rect = { id: id1, x: 0, y: 0, width: 1, height: 1 }
			const r2: Rect = { id: id2, x: 2, y: 2, width: 2, height: 2 }

			const prev = createDocState({
				shapes: new Map([
					[id1, r1],
					[id2, r2],
				]),
				shapeOrder: [id1, id2],
			})

			const next = docReducer(prev, {
				type: "REMOVE_RECT",
				before: r1,
			} as any)

			expect(next).not.toBe(prev)
			expect(next.shapes).not.toBe(prev.shapes)
			expect(next.shapeOrder).not.toBe(prev.shapeOrder)

			expect(next.shapes.has(id1)).toBe(false)
			expect(next.shapes.get(id2)).toEqual(r2)
			expect(next.shapeOrder).toEqual([id2])
		})

		it("is safe to remove an id not in shapeOrder; order stays filtered", () => {
			const id = createShapeIdT("shape-1")
			const rect: Rect = { id, x: 0, y: 0, width: 1, height: 1 }

			const prev = createDocState({
				shapes: new Map([[id, rect]]),
				shapeOrder: [],
			})

			const next = docReducer(prev, {
				type: "REMOVE_RECT",
				before: rect,
			} as any)

			expect(next.shapes.has(id)).toBe(false)
			expect(next.shapeOrder).toEqual([])
		})
	})
})
