import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/components/EditorCanvas/helpers/createShapeId", () => ({
	createShapeId: vi.fn(),
}))
vi.mock("@/components/EditorCanvas/helpers/normaliseRect", () => ({
	normaliseRect: vi.fn(),
}))

import { createShapeId } from "@/components/EditorCanvas/helpers/createShapeId"
import { normaliseRect } from "@/components/EditorCanvas/helpers/normaliseRect"
import { docReducer } from "@/components/EditorCanvas/reducer/docReducer"

import type {
	CanvasPoint,
	DocumentState,
	Rect,
	ShapeId,
} from "@/components/EditorCanvas/types"

const createShapeIdMock = vi.mocked(createShapeId)
const normaliseRectMock = vi.mocked(normaliseRect)

const createPoint = (x: number, y: number): CanvasPoint => ({ x, y })
const createShapeIdT = (s: string) => s as ShapeId

function createDocState(overrides?: Partial<DocumentState>): DocumentState {
	return {
		shapes: new Map(),
		shapeOrder: [],
		...overrides,
	}
}

describe("docReducer", () => {
	beforeEach(() => {
		createShapeIdMock.mockReset()
		normaliseRectMock.mockReset()
	})

	describe("COMMIT_DRAW_RECT", () => {
		it("creates a shape id, normalises rect, inserts into shapes, appends to shapeOrder", () => {
			const origin = createPoint(10, 20)
			const current = createPoint(30, 5)

			const id = createShapeIdT("shape-1")
			createShapeIdMock.mockReturnValue(id)

			const rect: Rect = {
				id,
				x: 10,
				y: 5,
				width: 20,
				height: 15,
			}
			normaliseRectMock.mockReturnValue(rect)

			const prev = createDocState()

			const next = docReducer(prev, {
				type: "COMMIT_DRAW_RECT",
				origin,
				current,
			})

			// calls
			expect(createShapeIdMock).toHaveBeenCalledTimes(1)
			expect(normaliseRectMock).toHaveBeenCalledWith(origin, current, id)

			// immutability / updates
			expect(next).not.toBe(prev)
			expect(next.shapes).not.toBe(prev.shapes)
			expect(next.shapeOrder).not.toBe(prev.shapeOrder)

			// contents
			expect(next.shapes.get(id)).toEqual(rect)
			expect(next.shapeOrder).toEqual([id])
		})

		it("preserves existing shapes and order, and appends new id", () => {
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

			const origin = createPoint(1, 1)
			const current = createPoint(2, 2)

			const newId = createShapeIdT("shape-new")
			createShapeIdMock.mockReturnValue(newId)

			const newRect: Rect = {
				id: newId,
				x: 1,
				y: 1,
				width: 1,
				height: 1,
			}
			normaliseRectMock.mockReturnValue(newRect)

			const next = docReducer(prev, {
				type: "COMMIT_DRAW_RECT",
				origin,
				current,
			})

			expect(next.shapes.get(existingId)).toEqual(existingRect)
			expect(next.shapes.get(newId)).toEqual(newRect)
			expect(next.shapeOrder).toEqual([existingId, newId])
		})
	})

	describe("MOVE_SHAPE", () => {
		it("noops (Day 2 stub)", () => {
			const prev = createDocState()

			const next = docReducer(prev, {
				type: "MOVE_SHAPE",
				id: createShapeIdT("shape-1"),
				dx: 5,
				dy: -3,
			})

			expect(next).toBe(prev)
			expect(createShapeIdMock).not.toHaveBeenCalled()
			expect(normaliseRectMock).not.toHaveBeenCalled()
		})
	})
})
