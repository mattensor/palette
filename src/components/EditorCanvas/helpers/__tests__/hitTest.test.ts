import { describe, expect, test } from "vitest"
import type { ShapeId } from "@/components/EditorCanvas/types"
import { canvasPointFactory } from "@/factories/canvasPointFactory"
import { docFactory } from "@/factories/docFactory"
import { rectFactory } from "@/factories/rectFactory"
import { hitTestTopmostShape, pointInRect } from "../hitTest"

describe("pointInRect", () => {
	const rect = rectFactory({ x: 0, y: 0, width: 50, height: 50 })

	test("returns true when point is inside", () => {
		const point = canvasPointFactory({ x: 25, y: 25 })
		expect(pointInRect(rect, point)).toBe(true)
	})

	test("returns false when point is outside", () => {
		const point = canvasPointFactory({ x: 75, y: 75 })
		expect(pointInRect(rect, point)).toBe(false)
	})
})

describe("hitTestTopmostShape", () => {
	const point = canvasPointFactory({ x: 25, y: 25 })
	const firstRect = rectFactory({ x: 0, y: 0, width: 30, height: 30 })
	const secondRect = rectFactory({ x: 15, y: 15, width: 40, height: 40 })

	test("returns the topmost shape when multiple shapes overlap (uses shapeOrder topmost)", () => {
		const shapes = new Map<ShapeId, typeof firstRect>([
			[firstRect.id, firstRect],
			[secondRect.id, secondRect],
		])

		// secondRect is topmost because it's later in the order
		const shapeOrder = [firstRect.id, secondRect.id]
		const doc = docFactory({ shapes, shapeOrder })

		expect(hitTestTopmostShape(doc, point)).toEqual(secondRect.id)
	})

	test("returns the only shape that contains the point", () => {
		const shapes = new Map<ShapeId, typeof firstRect>([
			[firstRect.id, firstRect],
		])
		const shapeOrder = [firstRect.id]
		const doc = docFactory({ shapes, shapeOrder })

		expect(hitTestTopmostShape(doc, point)).toEqual(firstRect.id)
	})

	test("returns null when no shapes contain the point", () => {
		const shapes = new Map<ShapeId, typeof firstRect>()
		const shapeOrder: ShapeId[] = []
		const doc = docFactory({ shapes, shapeOrder })

		expect(hitTestTopmostShape(doc, point)).toBeNull()
	})

	test("skips missing shapes referenced by shapeOrder", () => {
		const missingId = "missing" as ShapeId

		const shapes = new Map<ShapeId, typeof firstRect>([
			[secondRect.id, secondRect],
		])
		const shapeOrder = [missingId, secondRect.id] // topmost is secondRect; missing should be ignored
		const doc = docFactory({ shapes, shapeOrder })

		expect(hitTestTopmostShape(doc, point)).toEqual(secondRect.id)
	})
})
