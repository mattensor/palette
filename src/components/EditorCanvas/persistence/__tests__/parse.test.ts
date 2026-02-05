import { describe, expect, it } from "vitest"
import type {
	DocumentState,
	EditorDocumentV1,
	Rect,
	ShapeId,
} from "@/components/EditorCanvas/types"
import { fromPersisted, toPersisted } from "../serialise"

const asShapeId = (s: string) => s as ShapeId

describe("persistence mapping (toPersisted / fromPersisted)", () => {
	it("toPersisted converts runtime DocumentState -> EditorDocumentV1 (string ids)", () => {
		const a = asShapeId("a")
		const b = asShapeId("b")

		const rectA: Rect = { id: a, x: 0, y: 0, width: 10, height: 10 }
		const rectB: Rect = { id: b, x: 5, y: 6, width: 7, height: 8 }

		const doc: DocumentState = {
			shapes: new Map<ShapeId, Rect>([
				[a, rectA],
				[b, rectB],
			]),
			shapeOrder: [b, a],
		}

		const persisted = toPersisted(doc)

		expect(persisted).toEqual<EditorDocumentV1>({
			version: 1,
			shapes: [
				{ id: "a", x: 0, y: 0, width: 10, height: 10 },
				{ id: "b", x: 5, y: 6, width: 7, height: 8 },
			],
			shapeOrder: ["b", "a"],
		})
	})

	it("fromPersisted converts EditorDocumentV1 -> runtime DocumentState (branded ids + Map)", () => {
		const persisted: EditorDocumentV1 = {
			version: 1,
			shapes: [
				{ id: "a", x: 0, y: 0, width: 10, height: 10 },
				{ id: "b", x: 5, y: 6, width: 7, height: 8 },
			],
			shapeOrder: ["b", "a"],
		}

		const doc = fromPersisted(persisted)

		expect(doc.shapeOrder).toEqual([asShapeId("b"), asShapeId("a")])

		const rectA = doc.shapes.get(asShapeId("a"))
		const rectB = doc.shapes.get(asShapeId("b"))

		expect(rectA).toEqual({
			id: asShapeId("a"),
			x: 0,
			y: 0,
			width: 10,
			height: 10,
		})
		expect(rectB).toEqual({
			id: asShapeId("b"),
			x: 5,
			y: 6,
			width: 7,
			height: 8,
		})
	})

	it("round-trips: fromPersisted(toPersisted(doc)) preserves doc content", () => {
		const a = asShapeId("a")
		const b = asShapeId("b")

		const doc: DocumentState = {
			shapes: new Map<ShapeId, Rect>([
				[a, { id: a, x: 1, y: 2, width: 3, height: 4 }],
				[b, { id: b, x: 9, y: 8, width: 7, height: 6 }],
			]),
			shapeOrder: [a, b],
		}

		const persisted = toPersisted(doc)
		const restored = fromPersisted(persisted)

		expect(restored.shapeOrder).toEqual([a, b])

		expect(restored.shapes.get(a)).toEqual(doc.shapes.get(a))
		expect(restored.shapes.get(b)).toEqual(doc.shapes.get(b))
	})

	it("toPersisted preserves shapeOrder independently of Map insertion order", () => {
		const a = asShapeId("a")
		const b = asShapeId("b")

		const doc: DocumentState = {
			shapes: new Map<ShapeId, Rect>([
				[b, { id: b, x: 0, y: 0, width: 1, height: 1 }],
				[a, { id: a, x: 0, y: 0, width: 2, height: 2 }],
			]),
			shapeOrder: [a, b],
		}

		const persisted = toPersisted(doc)
		expect(persisted.shapeOrder).toEqual(["a", "b"])
	})
})
