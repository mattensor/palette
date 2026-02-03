import { describe, expect, test } from "vitest"
import type { ShapeId } from "@/components/EditorCanvas/types"
import { canvasPointFactory } from "@/factories/canvasPointFactory"
import { docFactory } from "@/factories/docFactory"
import { rectFactory } from "@/factories/rectFactory"
import { hitTestTopmostShape, pointInRect } from "../hitTest"

// Minimal state helper for hit testing
function makeState(doc: ReturnType<typeof docFactory>) {
	return {
		doc,
		debug: {
			metrics: {
				hitTestMsLast: null,
				hitTests: 0,
			},
		},
	} as any // keep minimal; avoid pulling full EditorState factory if you don't have one
}

describe("pointInRect", () => {
	const rect = rectFactory({ x: 0, y: 0, width: 50, height: 50 })

	describe("when the point is inside the shape", () => {
		test("returns true", () => {
			const point = canvasPointFactory({ x: 25, y: 25 })
			expect(pointInRect(rect, point)).toBe(true)
		})
	})

	describe("when the point is outside the shape", () => {
		test("returns false", () => {
			const point = canvasPointFactory({ x: 75, y: 75 })
			expect(pointInRect(rect, point)).toBe(false)
		})
	})
})

describe("hitTestTopmostShape", () => {
	const point = canvasPointFactory({ x: 25, y: 25 })
	const firstRect = rectFactory({ x: 0, y: 0, width: 30, height: 30 })
	const secondRect = rectFactory({ x: 15, y: 15, width: 40, height: 40 })

	describe("when multiple shapes overlap the point", () => {
		const shapes = new Map([
			[firstRect.id, firstRect],
			[secondRect.id, secondRect],
		])
		const shapeOrder = [firstRect.id, secondRect.id]
		const doc = docFactory({ shapes, shapeOrder })

		test("returns the topmost shape and records metrics", () => {
			const state = makeState(doc)

			expect(hitTestTopmostShape(state, point)).toEqual(secondRect.id)

			expect(state.debug.metrics.hitTests).toBe(1)
			expect(state.debug.metrics.hitTestMsLast).not.toBeNull()
			expect(state.debug.metrics.hitTestMsLast).toBeGreaterThanOrEqual(0)
		})
	})

	describe("when exactly one shape contains the point", () => {
		const shapes = new Map([[firstRect.id, firstRect]])
		const shapeOrder = [firstRect.id]
		const doc = docFactory({ shapes, shapeOrder })

		test("returns that shape and records metrics", () => {
			const state = makeState(doc)

			expect(hitTestTopmostShape(state, point)).toEqual(firstRect.id)

			expect(state.debug.metrics.hitTests).toBe(1)
			expect(state.debug.metrics.hitTestMsLast).not.toBeNull()
			expect(state.debug.metrics.hitTestMsLast).toBeGreaterThanOrEqual(0)
		})
	})

	describe("when no shapes contain the point", () => {
		const shapes = new Map()
		const shapeOrder: ShapeId[] = []
		const doc = docFactory({ shapes, shapeOrder })

		test("returns null and records metrics", () => {
			const state = makeState(doc)

			expect(hitTestTopmostShape(state, point)).toBeNull()

			expect(state.debug.metrics.hitTests).toBe(1)
			expect(state.debug.metrics.hitTestMsLast).not.toBeNull()
			expect(state.debug.metrics.hitTestMsLast).toBeGreaterThanOrEqual(0)
		})
	})
})
