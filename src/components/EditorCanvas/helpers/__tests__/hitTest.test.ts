import { describe, expect, test } from "vitest"
import type { ShapeId } from "@/components/EditorCanvas/types"
import { canvasPointFactory } from "@/factories/canvasPointFactory"
import { docFactory } from "@/factories/docFactory"
import { rectFactory } from "@/factories/rectFactory"
import { hitTestTopmostShape, pointInRect } from "../hitTest"

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

		test("returns the topmost shape", () => {
			expect(hitTestTopmostShape(doc, point)).toEqual(secondRect.id)
		})
	})

	describe("when exactly one shape contains the point", () => {
		const shapes = new Map([[firstRect.id, firstRect]])
		const shapeOrder = [firstRect.id]
		const doc = docFactory({ shapes, shapeOrder })

		test("returns that shape", () => {
			expect(hitTestTopmostShape(doc, point)).toEqual(firstRect.id)
		})
	})

	describe("when no shapes contain the point", () => {
		const shapes = new Map()
		const shapeOrder: ShapeId[] = []
		const doc = docFactory({ shapes, shapeOrder })

		test("returns null", () => {
			expect(hitTestTopmostShape(doc, point)).toBeNull()
		})
	})
})
