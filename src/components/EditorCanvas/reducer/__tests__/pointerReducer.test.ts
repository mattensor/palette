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
	Rect,
	ShapeId,
} from "@/components/EditorCanvas/types"
import { editorEventFactory } from "@/factories/editorEventFactory"
import { editorStateFactory } from "@/factories/editorStateFactory"
import { rectFactory } from "@/factories/rectFactory"

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

		it("arms dragSelection + selects shape when clicking on a shape (hitTest returns id)", () => {
			const shapeId = createShapeId("shape-1")
			hitTestMock.mockReturnValue(shapeId)

			const rect: Rect = rectFactory({ x: 10, y: 20, width: 30, height: 40 })
			const prev = editorStateFactory({
				doc: {
					...editorStateFactory().doc,
					shapes: new Map([[shapeId, rect]]),
				},
			})

			const event = editorEventFactory({
				type: "POINTER_DOWN",
				pointerId: createPointerId("p1"),
				position: createPoint(10, 10),
			})

			const res = pointerReducer(prev, event)

			expect(hitTestMock).toHaveBeenCalledWith(prev.doc, event.position)
			expect(res.effects).toEqual([])

			expect(res.session.selection).toEqual({ kind: "shape", id: shapeId })
			expect(res.session.hover).toEqual({ kind: "none" })
			expect(res.session.mode).toEqual({
				kind: "armed",
				pointerId: createPointerId("p1"),
				origin: event.position,
				intent: {
					kind: "dragSelection",
					shapeId,
					startPointer: event.position,
					startRect: rect,
				},
			})
		})

		it("arms drawRect when clicking empty canvas, clears hover and selection", () => {
			hitTestMock.mockReturnValue(null)

			const prev = editorStateFactory({
				session: {
					...editorStateFactory().session,
					hover: { kind: "shape", id: createShapeId("old-hover") },
					selection: { kind: "shape", id: createShapeId("old-selection") },
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
				kind: "armed",
				pointerId: createPointerId("p1"),
				origin: event.position,
				intent: { kind: "drawRect" },
			})
			expect(res.session.hover).toEqual({ kind: "none" })
			expect(res.session.selection).toEqual({ kind: "none" })
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

		it("armed drawRect: noops for non-active pointerId", () => {
			hitTestMock.mockReturnValue(null)

			const prev = editorStateFactory({
				session: {
					...editorStateFactory().session,
					mode: {
						kind: "armed",
						pointerId: createPointerId("p1"),
						origin: createPoint(0, 0),
						intent: { kind: "drawRect" },
					},
				},
			})

			const event = editorEventFactory({
				type: "POINTER_MOVE",
				pointerId: createPointerId("p2"),
				position: createPoint(10, 0),
			})

			const res = pointerReducer(prev, event)
			expect(res.session).toBe(prev.session)
			expect(res.effects).toEqual([])
		})

		it("armed drawRect: noops until MIN_DRAG threshold is exceeded, then enters drawingRect", () => {
			hitTestMock.mockReturnValue(null)

			const prev = editorStateFactory()
			const down = editorEventFactory({
				type: "POINTER_DOWN",
				pointerId: createPointerId("p1"),
				position: createPoint(0, 0),
			})
			const armed = pointerReducer(prev, down).session

			// still within threshold (<= 3px delta)
			const moveSmall = editorEventFactory({
				type: "POINTER_MOVE",
				pointerId: createPointerId("p1"),
				position: createPoint(3, 0),
			})
			const resSmall = pointerReducer({ ...prev, session: armed }, moveSmall)
			expect(resSmall.session).toBe(armed)
			expect(resSmall.effects).toEqual([])

			// exceeds threshold
			const moveBig = editorEventFactory({
				type: "POINTER_MOVE",
				pointerId: createPointerId("p1"),
				position: createPoint(4, 0),
			})
			const resBig = pointerReducer({ ...prev, session: armed }, moveBig)
			expect(resBig.effects).toEqual([])
			expect(resBig.session.mode).toEqual({
				kind: "drawingRect",
				pointerId: createPointerId("p1"),
				origin: createPoint(0, 0),
				current: createPoint(4, 0),
			})
		})

		it("armed dragSelection: noops until MIN_DRAG, then enters draggingSelection and emits SET_SHAPE_POSITION", () => {
			const shapeId = createShapeId("shape-1")
			hitTestMock.mockReturnValue(shapeId)

			const rect: Rect = rectFactory({ x: 10, y: 20, width: 30, height: 40 })
			const prev = editorStateFactory({
				doc: {
					...editorStateFactory().doc,
					shapes: new Map([[shapeId, rect]]),
				},
			})

			const down = editorEventFactory({
				type: "POINTER_DOWN",
				pointerId: createPointerId("p1"),
				position: createPoint(0, 0),
			})
			const armedState = pointerReducer(prev, down)

			expect(armedState.session.mode.kind).toBe("armed")

			// within threshold: noop
			const moveSmall = editorEventFactory({
				type: "POINTER_MOVE",
				pointerId: createPointerId("p1"),
				position: createPoint(0, 3),
			})
			const resSmall = pointerReducer(
				{ ...prev, session: armedState.session },
				moveSmall,
			)
			expect(resSmall.session).toBe(armedState.session)
			expect(resSmall.effects).toEqual([])

			// exceeds threshold: starts dragging and emits effect
			const moveBig = editorEventFactory({
				type: "POINTER_MOVE",
				pointerId: createPointerId("p1"),
				position: createPoint(0, 4),
			})
			const resBig = pointerReducer(
				{ ...prev, session: armedState.session },
				moveBig,
			)

			expect(resBig.session.mode).toEqual({
				kind: "draggingSelection",
				shapeId,
				pointerId: createPointerId("p1"),
				startPointer: createPoint(0, 0),
				startRect: rect,
			})
			expect(resBig.effects).toEqual([
				{
					type: "SET_SHAPE_POSITION",
					id: shapeId,
					x: 10,
					y: 24, // 20 + 4
				},
			])
		})

		it("draggingSelection: emits SET_SHAPE_POSITION on every move (anchored to startPointer/startRect)", () => {
			const shapeId = createShapeId("shape-1")

			const prev = editorStateFactory({
				session: {
					...editorStateFactory().session,
					mode: {
						kind: "draggingSelection",
						shapeId,
						pointerId: createPointerId("p1"),
						startPointer: createPoint(10, 10),
						startRect: rectFactory({ x: 1, y: 2, width: 3, height: 4 }),
					},
				},
			})

			const event = editorEventFactory({
				type: "POINTER_MOVE",
				pointerId: createPointerId("p1"),
				position: createPoint(15, 5),
			})

			const res = pointerReducer(prev, event)

			expect(res.session.mode).toEqual(prev.session.mode)
			expect(res.effects).toEqual([
				{
					type: "SET_SHAPE_POSITION",
					id: shapeId,
					x: 1 + (15 - 10), // 6
					y: 2 + (5 - 10), // -3
				},
			])
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
		it("armed: returns to idle and emits no effects (matching pointerId)", () => {
			const prev = editorStateFactory({
				session: {
					...editorStateFactory().session,
					mode: {
						kind: "armed",
						pointerId: createPointerId("p1"),
						origin: createPoint(0, 0),
						intent: { kind: "drawRect" },
					},
				},
			})

			const event = editorEventFactory({
				type: "POINTER_UP",
				pointerId: createPointerId("p1"),
				position: createPoint(0, 0),
			})

			const res = pointerReducer(prev, event)

			expect(res.effects).toEqual([])
			expect(res.session.mode).toEqual({ kind: "idle" })
		})

		it("armed: noops for non-matching pointerId", () => {
			const prev = editorStateFactory({
				session: {
					...editorStateFactory().session,
					mode: {
						kind: "armed",
						pointerId: createPointerId("p1"),
						origin: createPoint(0, 0),
						intent: { kind: "drawRect" },
					},
				},
			})

			const event = editorEventFactory({
				type: "POINTER_UP",
				pointerId: createPointerId("p2"),
				position: createPoint(0, 0),
			})

			const res = pointerReducer(prev, event)
			expect(res.session).toBe(prev.session)
			expect(res.effects).toEqual([])
		})

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
					origin: createPoint(0, 0),
					current: createPoint(5, 5),
				},
			])

			expect(res.session.mode).toEqual({ kind: "idle" })
			expect(res.session.hover).toEqual(prev.session.hover)
		})

		it("draggingSelection: ends drag and maintains selection for matching pointerId", () => {
			const shapeId = createShapeId("shape-1")
			const prev = editorStateFactory({
				session: {
					...editorStateFactory().session,
					mode: {
						kind: "draggingSelection",
						shapeId,
						pointerId: createPointerId("p1"),
						startPointer: createPoint(0, 0),
						startRect: rectFactory({ x: 1, y: 2, width: 3, height: 4 }),
					},
					selection: { kind: "shape", id: shapeId },
				},
			})

			const event = editorEventFactory({
				type: "POINTER_UP",
				pointerId: createPointerId("p1"),
				position: createPoint(10, 10),
			})

			const res = pointerReducer(prev, event)

			expect(res.effects).toEqual([])
			expect(res.session.mode).toEqual({ kind: "idle" })
			expect(res.session.selection).toEqual({ kind: "shape", id: shapeId })
		})

		it("draggingSelection: noops if pointerId doesn't match", () => {
			const prev = editorStateFactory({
				session: {
					...editorStateFactory().session,
					mode: {
						kind: "draggingSelection",
						shapeId: createShapeId("shape-1"),
						pointerId: createPointerId("p1"),
						startPointer: createPoint(0, 0),
						startRect: rectFactory({ x: 1, y: 2, width: 3, height: 4 }),
					},
				},
			})

			const event = editorEventFactory({
				type: "POINTER_UP",
				pointerId: createPointerId("p2"),
				position: createPoint(0, 0),
			})

			const res = pointerReducer(prev, event)
			expect(res.session).toBe(prev.session)
			expect(res.effects).toEqual([])
		})

		it("noops if not drawingRect/armed/draggingSelection", () => {
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
		it("resets mode to idle and clears hover (matching pointerId for active modes)", () => {
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

		it("noops if pointerId doesn't match active mode pointerId", () => {
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
				pointerId: createPointerId("p2"),
				position: createPoint(999, 999),
			})

			const res = pointerReducer(prev, event)
			expect(res.session).toBe(prev.session)
			expect(res.effects).toEqual([])
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
