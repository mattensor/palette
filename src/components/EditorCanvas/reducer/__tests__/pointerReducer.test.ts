import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/components/EditorCanvas/helpers/hitTest", () => ({
	hitTestTopmostShape: vi.fn(),
}))

import { hitTestTopmostShape } from "@/components/EditorCanvas/helpers/hitTest"
import { pointerReducer } from "@/components/EditorCanvas/reducer/pointerReducer"

import type {
	CanvasPoint,
	EditorEvent,
	PointerId,
	ShapeId,
} from "@/components/EditorCanvas/types"
import { editorEventFactory } from "@/factories/editorEventFactory"
import { editorStateFactory } from "@/factories/editorStateFactory"

const hitTestMock = vi.mocked(hitTestTopmostShape)

const createPointerId = (s: string) => s as PointerId
const createShapeId = (s: string) => s as ShapeId
const createPoint = (x: number, y: number): CanvasPoint => ({ x, y })

describe("pointerReducer", () => {
	beforeEach(() => {
		hitTestMock.mockReset()
	})

	describe("POINTER_DOWN", () => {
		it("noops if mode is not idle", () => {
			const prev = editorStateFactory({
				session: {
					mode: {
						kind: "drawingRect",
						pointerId: createPointerId("p1"),
						origin: createPoint(0, 0),
						current: createPoint(1, 1),
					},
					selection: { kind: "none" },
					hover: { kind: "none" },
				},
			})

			const event = editorEventFactory({
				type: "POINTER_DOWN",
				pointerId: createPointerId("p1"),
				position: createPoint(10, 10),
			})

			const res = pointerReducer(prev, event)
			expect(res.session).toBe(prev.session)
			expect(res.effects).toEqual([])
		})

		it("noops if clicking on a shape (hitTest returns id)", () => {
			hitTestMock.mockReturnValue(createShapeId("shape-1"))

			const prev = editorStateFactory()
			const event = editorEventFactory({
				type: "POINTER_DOWN",
				pointerId: createPointerId("p1"),
				position: createPoint(10, 10),
			})

			const res = pointerReducer(prev, event)

			expect(hitTestMock).toHaveBeenCalledWith(prev.doc, event.position)
			expect(res.session).toBe(prev.session)
			expect(res.effects).toEqual([])
		})

		it("starts drawingRect when clicking empty canvas and clears hover", () => {
			hitTestMock.mockReturnValue(null)

			const prev = editorStateFactory({
				session: {
					...editorStateFactory().session,
					hover: { kind: "shape", id: createShapeId("old-hover") },
				},
			})

			const event = editorEventFactory({
				type: "POINTER_DOWN",
				pointerId: createPointerId("p1"),
				position: createPoint(10, 20),
			})

			const res = pointerReducer(prev, event)

			expect(res.effects).toEqual([])
			expect(res.session.mode).toEqual({
				kind: "drawingRect",
				pointerId: createPointerId("p1"),
				origin: createPoint(10, 20),
				current: createPoint(10, 20),
			})
			expect(res.session.hover).toEqual({ kind: "none" })
			expect(res.session.selection).toEqual(prev.session.selection)
		})
	})

	describe("POINTER_MOVE", () => {
		it("when idle: sets hover to shape when hitTest returns shape", () => {
			hitTestMock.mockReturnValue(createShapeId("shape-1"))

			const prev = editorStateFactory()
			const event = editorEventFactory({
				type: "POINTER_MOVE",
				pointerId: createPointerId("p1"),
				position: createPoint(5, 5),
			})

			const res = pointerReducer(prev, event)

			expect(hitTestMock).toHaveBeenCalledWith(prev.doc, event.position)
			expect(res.effects).toEqual([])
			expect(res.session.mode).toEqual({ kind: "idle" })
			expect(res.session.hover).toEqual({
				kind: "shape",
				id: createShapeId("shape-1"),
			})
		})

		it("when idle: clears hover when hitTest returns null", () => {
			hitTestMock.mockReturnValue(null)

			const prev = editorStateFactory({
				session: {
					...editorStateFactory().session,
					hover: { kind: "shape", id: createShapeId("shape-1") },
				},
			})

			const event = editorEventFactory({
				type: "POINTER_MOVE",
				pointerId: createPointerId("p1"),
				position: createPoint(123, 456),
			})

			const res = pointerReducer(prev, event)

			expect(res.effects).toEqual([])
			expect(res.session.hover).toEqual({ kind: "none" })
		})

		it("when idle: noops if hover already same shape", () => {
			hitTestMock.mockReturnValue(createShapeId("shape-1"))

			const prev = editorStateFactory({
				session: {
					...editorStateFactory().session,
					hover: { kind: "shape", id: createShapeId("shape-1") },
				},
			})

			const event = editorEventFactory({
				type: "POINTER_MOVE",
				pointerId: createPointerId("p1"),
				position: createPoint(9, 9),
			})

			const res = pointerReducer(prev, event)

			expect(res.session).toBe(prev.session) // noop keeps reference
			expect(res.effects).toEqual([])
		})

		it("when idle: noops if hover already none and hitTest null", () => {
			hitTestMock.mockReturnValue(null)

			const prev = editorStateFactory()
			const event = editorEventFactory({
				type: "POINTER_MOVE",
				pointerId: createPointerId("p1"),
				position: createPoint(1, 2),
			})

			const res = pointerReducer(prev, event)
			expect(res.session).toBe(prev.session)
			expect(res.effects).toEqual([])
		})

		it("when drawingRect: updates current for matching pointerId and does not hitTest", () => {
			const prev = editorStateFactory({
				session: {
					...editorStateFactory().session,
					mode: {
						kind: "drawingRect",
						pointerId: createPointerId("p1"),
						origin: createPoint(0, 0),
						current: createPoint(1, 1),
					},
					hover: { kind: "shape", id: createShapeId("shape-1") },
				},
			})

			const event = editorEventFactory({
				type: "POINTER_MOVE",
				pointerId: createPointerId("p1"),
				position: createPoint(9, 9),
			})

			const res = pointerReducer(prev, event)

			expect(hitTestMock).not.toHaveBeenCalled()
			expect(res.effects).toEqual([])
			expect(res.session.mode).toEqual({
				kind: "drawingRect",
				pointerId: createPointerId("p1"),
				origin: createPoint(0, 0),
				current: createPoint(9, 9),
			})
			expect(res.session.hover).toEqual(prev.session.hover)
		})

		it("when drawingRect: noops for non-matching pointerId", () => {
			const prev = editorStateFactory({
				session: {
					...editorStateFactory().session,
					mode: {
						kind: "drawingRect",
						pointerId: createPointerId("p1"),
						origin: createPoint(0, 0),
						current: createPoint(1, 1),
					},
				},
			})

			const event = editorEventFactory({
				type: "POINTER_MOVE",
				pointerId: createPointerId("p2"),
				position: createPoint(9, 9),
			})

			const res = pointerReducer(prev, event)

			expect(res.session).toBe(prev.session)
			expect(res.effects).toEqual([])
		})
	})

	describe("POINTER_UP", () => {
		it("ends drawingRect and returns to idle for matching pointerId (emits COMMIT_DRAW_RECT)", () => {
			const prev = editorStateFactory({
				session: {
					...editorStateFactory().session,
					mode: {
						kind: "drawingRect",
						pointerId: createPointerId("p1"),
						origin: createPoint(0, 0),
						current: createPoint(5, 5),
					},
					hover: { kind: "shape", id: createShapeId("shape-1") },
				},
			})

			const event = editorEventFactory({
				type: "POINTER_UP",
				pointerId: createPointerId("p1"),
				position: createPoint(5, 5),
			})

			const res = pointerReducer(prev, event)

			expect(res.effects).toEqual([
				{
					type: "COMMIT_DRAW_RECT",
					origin: createPoint(0, 0), // from mode snapshot
					current: createPoint(5, 5), // from pointer up position
				},
			])

			expect(res.session.mode).toEqual({ kind: "idle" })
			expect(res.session.hover).toEqual(prev.session.hover)
		})

		it("noops if not drawingRect", () => {
			const prev = editorStateFactory()
			const event = editorEventFactory({
				type: "POINTER_UP",
				pointerId: createPointerId("p1"),
				position: createPoint(0, 0),
			})

			const res = pointerReducer(prev, event)
			expect(res.session).toBe(prev.session)
			expect(res.effects).toEqual([])
		})

		it("noops if pointerId doesn't match active drawing pointer", () => {
			const prev = editorStateFactory({
				session: {
					...editorStateFactory().session,
					mode: {
						kind: "drawingRect",
						pointerId: createPointerId("p1"),
						origin: createPoint(0, 0),
						current: createPoint(5, 5),
					},
				},
			})

			const event = editorEventFactory({
				type: "POINTER_UP",
				pointerId: createPointerId("p2"),
				position: createPoint(5, 5),
			})

			const res = pointerReducer(prev, event)
			expect(res.session).toBe(prev.session)
			expect(res.effects).toEqual([])
		})
	})

	describe("POINTER_CANCEL", () => {
		it("resets mode to idle and clears hover", () => {
			const prev = editorStateFactory({
				session: {
					...editorStateFactory().session,
					mode: {
						kind: "drawingRect",
						pointerId: createPointerId("p1"),
						origin: createPoint(0, 0),
						current: createPoint(5, 5),
					},
					hover: { kind: "shape", id: createShapeId("shape-1") },
				},
			})

			const event = editorEventFactory({
				type: "POINTER_CANCEL",
				pointerId: createPointerId("p1"),
				position: createPoint(999, 999),
			})

			const res = pointerReducer(prev, event)

			expect(res.effects).toEqual([])
			expect(res.session.mode).toEqual({ kind: "idle" })
			expect(res.session.hover).toEqual({ kind: "none" })
			expect(res.session.selection).toEqual(prev.session.selection)
		})
	})

	describe("error case: unknown event type", () => {
		it("noops if handler missing", () => {
			const prev = editorStateFactory()
			const event = { type: "SOMETHING_ELSE" } as unknown as EditorEvent

			const res = pointerReducer(prev, event)
			expect(res.session).toBe(prev.session)
			expect(res.effects).toEqual([])
		})
	})
})
