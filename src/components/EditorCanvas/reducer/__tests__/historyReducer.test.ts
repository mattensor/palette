import { describe, expect, it } from "vitest"

import { historyReducer } from "@/components/EditorCanvas/reducer/historyReducer"
import type { ShapeId } from "@/components/EditorCanvas/types/domain"
import { docActionFactory } from "@/factories/docActionFactory"
import { docFactory } from "@/factories/docFactory"
import { docPatchFactory } from "@/factories/docPatchFactory"
import { editorStateFactory } from "@/factories/editorStateFactory"
import { rectFactory } from "@/factories/rectFactory"

describe("historyReducer", () => {
	it("COMMIT: applies patch, pushes patch to past, clears future", () => {
		const id = "shape-1" as ShapeId
		const rect = rectFactory({ id, x: 1, y: 2, width: 3, height: 4 })
		const patch = docPatchFactory.addRect(rect)

		const prev = editorStateFactory({
			doc: docFactory({
				shapes: new Map(),
				shapeOrder: [],
			}),
			history: {
				past: [],
				future: [docPatchFactory.removeRect(rect)],
			},
		})

		const next = historyReducer(prev, docActionFactory.commit(patch))

		expect(next.history.past).toEqual([patch])
		expect(next.history.future).toEqual([])

		expect(next.doc.shapes.get(id)).toEqual(rect)
		expect(next.doc.shapeOrder).toEqual([id])
	})

	it("UNDO: reverts last patch (ADD_RECT -> removed), moves patch from past to future", () => {
		const id = "shape-1" as ShapeId
		const rect = rectFactory({ id, x: 0, y: 0, width: 10, height: 10 })
		const addPatch = docPatchFactory.addRect(rect)

		const applied = historyReducer(
			editorStateFactory({
				doc: docFactory({
					shapes: new Map(),
					shapeOrder: [],
				}),
			}),
			docActionFactory.commit(addPatch),
		)

		expect(applied.doc.shapes.has(id)).toBe(true)
		expect(applied.history.past).toEqual([addPatch])

		const undone = historyReducer(applied, docActionFactory.undo())

		expect(undone.history.past).toEqual([])
		expect(undone.history.future).toEqual([addPatch])

		expect(undone.doc.shapes.has(id)).toBe(false)
		expect(undone.doc.shapeOrder).toEqual([])
	})

	it("REDO: reapplies most recent undone patch, moves it from future back to past", () => {
		const id = "shape-1" as ShapeId
		const rect = rectFactory({ id, x: 5, y: 6, width: 7, height: 8 })
		const addPatch = docPatchFactory.addRect(rect)

		const applied = historyReducer(
			editorStateFactory({
				doc: docFactory({
					shapes: new Map(),
					shapeOrder: [],
				}),
			}),
			docActionFactory.commit(addPatch),
		)
		const undone = historyReducer(applied, docActionFactory.undo())

		expect(undone.doc.shapes.has(id)).toBe(false)
		expect(undone.history.future).toEqual([addPatch])

		const redone = historyReducer(undone, docActionFactory.redo())

		expect(redone.history.past).toEqual([addPatch])
		expect(redone.history.future).toEqual([])

		expect(redone.doc.shapes.get(id)).toEqual(rect)
		expect(redone.doc.shapeOrder).toEqual([id])
	})

	it("UNDO: handles UPDATE_RECT by restoring before", () => {
		const id = "shape-1" as ShapeId
		const before = rectFactory({ id, x: 0, y: 0, width: 10, height: 10 })
		const after = rectFactory({ id, x: 100, y: 200, width: 10, height: 10 })

		const prev = editorStateFactory({
			doc: {
				...editorStateFactory().doc,
				shapes: new Map([[id, before]]),
				shapeOrder: [id],
			},
		})

		const patch = docPatchFactory.updateRect({ id, before, after })
		const applied = historyReducer(prev, docActionFactory.commit(patch))

		expect(applied.doc.shapes.get(id)).toEqual(after)
		expect(applied.history.past).toEqual([patch])

		const undone = historyReducer(applied, docActionFactory.undo())

		expect(undone.doc.shapes.get(id)).toEqual(before)
		expect(undone.history.past).toEqual([])
		expect(undone.history.future).toEqual([patch])
	})

	it("UNDO: noops when there is nothing to undo", () => {
		const prev = editorStateFactory({
			history: { past: [], future: [] },
		})

		const next = historyReducer(prev, docActionFactory.undo())

		expect(next).toBe(prev)
	})

	it("REDO: noops when there is nothing to redo", () => {
		const prev = editorStateFactory({
			history: { past: [], future: [] },
		})

		const next = historyReducer(prev, docActionFactory.redo())
		expect(next).toBe(prev)
	})

	it("COMMIT after UNDO: clears future (branching)", () => {
		const id1 = "shape-1" as ShapeId
		const rect1 = rectFactory({ id: id1 })
		const p1 = docPatchFactory.addRect(rect1)

		const id2 = "shape-2" as ShapeId
		const rect2 = rectFactory({ id: id2 })
		const p2 = docPatchFactory.addRect(rect2)

		const s1 = historyReducer(editorStateFactory(), docActionFactory.commit(p1))
		const s2 = historyReducer(s1, docActionFactory.undo())

		// now future has p1
		expect(s2.history.future).toEqual([p1])

		const s3 = historyReducer(s2, docActionFactory.commit(p2))
		expect(s3.history.future).toEqual([]) // branched: cleared
		expect(s3.history.past).toEqual([p2]) // typical behavior (only committed patch in past)
	})
})
