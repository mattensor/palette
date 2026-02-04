import { describe, expect, it } from "vitest"

import { applyDocAction } from "@/components/EditorCanvas/reducer/applyDocAction"
import type { ShapeId } from "@/components/EditorCanvas/types/domain"
import { docActionFactory } from "@/factories/docActionFactory"
import { docFactory } from "@/factories/docFactory"
import { docPatchFactory } from "@/factories/docPatchFactory"
import { editorStateFactory } from "@/factories/editorStateFactory"
import { rectFactory } from "@/factories/rectFactory"

describe("applyDocAction", () => {
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

		const next = applyDocAction(prev, docActionFactory.commit(patch))

		expect(next.history.past).toEqual([patch])
		expect(next.history.future).toEqual([])

		expect(next.doc.shapes.get(id)).toEqual(rect)
		expect(next.doc.shapeOrder).toEqual([id])
	})

	it("UNDO: reverts last patch (ADD_RECT -> removed), moves patch from past to future", () => {
		const id = "shape-1" as ShapeId
		const rect = rectFactory({ id, x: 0, y: 0, width: 10, height: 10 })
		const addPatch = docPatchFactory.addRect(rect)

		const applied = applyDocAction(
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

		const undone = applyDocAction(applied, docActionFactory.undo())

		expect(undone.history.past).toEqual([])
		expect(undone.history.future).toEqual([addPatch])

		expect(undone.doc.shapes.has(id)).toBe(false)
		expect(undone.doc.shapeOrder).toEqual([])
	})

	it("REDO: reapplies most recent undone patch, moves it from future back to past", () => {
		const id = "shape-1" as ShapeId
		const rect = rectFactory({ id, x: 5, y: 6, width: 7, height: 8 })
		const addPatch = docPatchFactory.addRect(rect)

		const applied = applyDocAction(
			editorStateFactory({
				doc: docFactory({
					shapes: new Map(),
					shapeOrder: [],
				}),
			}),
			docActionFactory.commit(addPatch),
		)
		const undone = applyDocAction(applied, docActionFactory.undo())

		expect(undone.doc.shapes.has(id)).toBe(false)
		expect(undone.history.future).toEqual([addPatch])

		const redone = applyDocAction(undone, docActionFactory.redo())

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
		const applied = applyDocAction(prev, docActionFactory.commit(patch))

		expect(applied.doc.shapes.get(id)).toEqual(after)
		expect(applied.history.past).toEqual([patch])

		const undone = applyDocAction(applied, docActionFactory.undo())

		expect(undone.doc.shapes.get(id)).toEqual(before)
		expect(undone.history.past).toEqual([])
		expect(undone.history.future).toEqual([patch])
	})

	it("UNDO: noops when there is nothing to undo", () => {
		const prev = editorStateFactory({
			history: { past: [], future: [] },
		})

		const next = applyDocAction(prev, docActionFactory.undo())

		expect(next).toBe(prev)
	})

	it("REDO: noops when there is nothing to redo", () => {
		const prev = editorStateFactory({
			history: { past: [], future: [] },
		})

		const next = applyDocAction(prev, docActionFactory.redo())
		expect(next).toBe(prev)
	})

	it("COMMIT after UNDO: clears future (branching)", () => {
		const id1 = "shape-1" as ShapeId
		const rect1 = rectFactory({ id: id1 })
		const p1 = docPatchFactory.addRect(rect1)

		const id2 = "shape-2" as ShapeId
		const rect2 = rectFactory({ id: id2 })
		const p2 = docPatchFactory.addRect(rect2)

		const id3 = "shape-3" as ShapeId
		const rect3 = rectFactory({ id: id3 })
		const p3 = docPatchFactory.addRect(rect3)

		// commit p1 then p2
		const s1 = applyDocAction(editorStateFactory(), docActionFactory.commit(p1))
		const s2 = applyDocAction(s1, docActionFactory.commit(p2))

		expect(s2.history.past).toEqual([p1, p2])
		expect(s2.history.future).toEqual([])

		// undo p2 => past:[p1], future:[p2]
		const s3 = applyDocAction(s2, docActionFactory.undo())

		expect(s3.history.past).toEqual([p1])
		expect(s3.history.future).toEqual([p2])

		// commit p3 => past:[p1,p3], future cleared
		const s4 = applyDocAction(s3, docActionFactory.commit(p3))

		expect(s4.history.future).toEqual([])
		expect(s4.history.past).toEqual([p1, p3])

		// doc contains p1 + p3 rects, not p2
		expect(s4.doc.shapes.get(id1)).toEqual(rect1)
		expect(s4.doc.shapes.get(id2)).toBeUndefined()
		expect(s4.doc.shapes.get(id3)).toEqual(rect3)
	})
})
