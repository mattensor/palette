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
})
