import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/components/EditorCanvas/reducer/actions/createRemoveRect", () => ({
	createRemoveRect: vi.fn(),
}))

import { createRemoveRect } from "@/components/EditorCanvas/reducer/actions/createRemoveRect"
import { keyboardReducer } from "@/components/EditorCanvas/reducer/keyboardReducer"
import type {
	EditorEvent,
	KeyboardEditorEvent,
	ShapeId,
} from "@/components/EditorCanvas/types"
import type { DocAction } from "@/components/EditorCanvas/types/actions"
import { editorStateFactory } from "@/factories/editorStateFactory"
import { keyboardEventFactory } from "@/factories/keyboardEventFactory"

const createRemoveRectMock = vi.mocked(createRemoveRect)
const createShapeId = (s: string) => s as unknown as ShapeId

describe("keyboardReducer", () => {
	beforeEach(() => {
		createRemoveRectMock.mockReset()
	})

	it("noops for non-KEY_DOWN events", () => {
		const prev = editorStateFactory()

		const event = { type: "FRAME_TICK", now: 123 } as unknown as EditorEvent
		const res = keyboardReducer(prev, event as unknown as KeyboardEditorEvent)

		expect(createRemoveRectMock).not.toHaveBeenCalled()
		expect(res.session).toBe(prev.session)
		expect(res.actions).toEqual([])
		expect(res.perf).toEqual([])
	})

	describe("Delete / Backspace", () => {
		it("noops when selection is none (does not call createRemoveRect)", () => {
			const prev = editorStateFactory({
				session: {
					...editorStateFactory().session,
					selection: { kind: "none" },
				},
			})

			const event = keyboardEventFactory({
				type: "KEY_DOWN",
				key: "Delete",
				modifiers: { meta: false, shift: false, alt: false, ctrl: false },
			})

			const res = keyboardReducer(prev, event)

			expect(createRemoveRectMock).not.toHaveBeenCalled()
			expect(res.session).toBe(prev.session)
			expect(res.actions).toEqual([])
			expect(res.perf).toEqual([])
		})

		it("clears selection and emits action when a shape is selected", () => {
			const id = createShapeId("shape-1")
			const removeAction = { type: "COMMIT" } as unknown as DocAction
			createRemoveRectMock.mockReturnValue(removeAction)

			const prev = editorStateFactory({
				session: {
					...editorStateFactory().session,
					selection: { kind: "shape", id },
				},
			})

			const event = keyboardEventFactory({
				type: "KEY_DOWN",
				key: "Backspace",
				modifiers: { meta: false, shift: false, alt: false, ctrl: false },
			})

			const res = keyboardReducer(prev, event)

			expect(createRemoveRectMock).toHaveBeenCalledWith(prev.doc, id)
			expect(res.session.selection).toEqual({ kind: "none" })
			expect(res.actions).toEqual([removeAction])
			expect(res.perf).toEqual([])
		})

		it("clears selection but emits no actions when createRemoveRect returns null", () => {
			const id = createShapeId("shape-1")
			createRemoveRectMock.mockReturnValue(null as any)

			const prev = editorStateFactory({
				session: {
					...editorStateFactory().session,
					selection: { kind: "shape", id },
				},
			})

			const event = keyboardEventFactory({
				type: "KEY_DOWN",
				key: "Delete",
				modifiers: { meta: false, shift: false, alt: false, ctrl: false },
			})

			const res = keyboardReducer(prev, event)

			expect(createRemoveRectMock).toHaveBeenCalledWith(prev.doc, id)
			expect(res.session.selection).toEqual({ kind: "none" })
			expect(res.actions).toEqual([])
			expect(res.perf).toEqual([])
		})
	})

	describe("z (undo/redo)", () => {
		it("emits UNDO when z is pressed without shift, and clears selection", () => {
			const prev = editorStateFactory({
				session: {
					...editorStateFactory().session,
					selection: { kind: "shape", id: createShapeId("shape-1") },
				},
			})

			const event = keyboardEventFactory({
				type: "KEY_DOWN",
				key: "z",
				modifiers: { meta: true, shift: false, alt: false, ctrl: false },
			})

			const res = keyboardReducer(prev, event)

			expect(createRemoveRectMock).not.toHaveBeenCalled()
			expect(res.session.selection).toEqual({ kind: "none" })
			expect(res.actions).toEqual([{ type: "UNDO" }])
			expect(res.perf).toEqual([])
		})

		it("emits REDO when z is pressed with shift, and clears selection", () => {
			const prev = editorStateFactory({
				session: {
					...editorStateFactory().session,
					selection: { kind: "shape", id: createShapeId("shape-1") },
				},
			})

			const event = keyboardEventFactory({
				type: "KEY_DOWN",
				key: "z",
				modifiers: { meta: true, shift: true, alt: false, ctrl: false },
			})

			const res = keyboardReducer(prev, event)

			expect(createRemoveRectMock).not.toHaveBeenCalled()
			expect(res.session.selection).toEqual({ kind: "none" })
			expect(res.actions).toEqual([{ type: "REDO" }])
			expect(res.perf).toEqual([])
		})
	})

	it("noops on unhandled key", () => {
		const prev = editorStateFactory({
			session: {
				...editorStateFactory().session,
				selection: { kind: "shape", id: createShapeId("shape-1") },
			},
		})

		const event = keyboardEventFactory({
			type: "KEY_DOWN",
			key: "Escape",
			modifiers: { meta: false, shift: false, alt: false, ctrl: false },
		})

		const res = keyboardReducer(prev, event)

		expect(createRemoveRectMock).not.toHaveBeenCalled()
		expect(res.session).toBe(prev.session) // unchanged
		expect(res.actions).toEqual([])
		expect(res.perf).toEqual([])
	})
})
