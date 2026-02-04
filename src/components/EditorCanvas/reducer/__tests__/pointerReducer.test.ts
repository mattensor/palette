import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("@/components/EditorCanvas/helpers/hitTest", () => ({
	hitTestTopmostShape: vi.fn(),
}))

vi.mock("@/components/EditorCanvas/reducer/actions/createAddRect", () => ({
	createAddRect: vi.fn(),
}))

vi.mock(
	"@/components/EditorCanvas/reducer/actions/createUpdateRectPosition",
	() => ({
		createUpdateRectPosition: vi.fn(),
	}),
)

import { hitTestTopmostShape } from "@/components/EditorCanvas/helpers/hitTest"
import { createAddRect } from "@/components/EditorCanvas/reducer/actions/createAddRect"
import { createUpdateRectPosition } from "@/components/EditorCanvas/reducer/actions/createUpdateRectPosition"
import { pointerReducer } from "@/components/EditorCanvas/reducer/pointerReducer"

import type {
	CanvasPoint,
	DocAction,
	EditorEvent,
	PointerEditorEvent,
	PointerId,
	Rect,
	ShapeId,
} from "@/components/EditorCanvas/types"
import { editorStateFactory } from "@/factories/editorStateFactory"
import { pointerEventFactory } from "@/factories/pointerEventFactory"
import { rectFactory } from "@/factories/rectFactory"

const hitTestMock = vi.mocked(hitTestTopmostShape)
const createAddRectMock = vi.mocked(createAddRect)
const createUpdateRectPositionMock = vi.mocked(createUpdateRectPosition)

const createPointerId = (s: string) => s as unknown as PointerId
const createShapeId = (s: string) => s as ShapeId
const createPoint = (x: number, y: number): CanvasPoint => ({ x, y })

function frameTick(now = 123): EditorEvent {
	return { type: "FRAME_TICK", now } as EditorEvent
}

function move(pointerId: PointerId, position: CanvasPoint): PointerEditorEvent {
	return pointerEventFactory({
		type: "POINTER_MOVE",
		pointerId,
		position,
	})
}

function expectHitTestPerf(perf: unknown) {
	// supports both shapes:
	//  - { type: "HIT_TEST" }
	//  - { type: "HIT_TEST", ms: number }
	expect(perf).toEqual(
		expect.arrayContaining([expect.objectContaining({ type: "HIT_TEST" })]),
	)
}

describe("pointerReducer (FRAME_TICK model)", () => {
	beforeEach(() => {
		hitTestMock.mockReset()
		createAddRectMock.mockReset()
		createUpdateRectPositionMock.mockReset()
	})

	describe("POINTER_DOWN", () => {
		it("noops if mode is not idle (no hitTest)", () => {
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
					latestPointer: { kind: "none" },
				},
			})

			const event = pointerEventFactory({
				type: "POINTER_DOWN",
				pointerId: createPointerId("p1"),
				position: createPoint(10, 10),
			})

			const res = pointerReducer(prev, event)

			expect(hitTestMock).not.toHaveBeenCalled()
			expect(res.session).toBe(prev.session)
			expect(res.actions).toEqual([])
			expect(res.perf).toEqual([])
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

			const event = pointerEventFactory({
				type: "POINTER_DOWN",
				pointerId: createPointerId("p1"),
				position: createPoint(10, 10),
			})

			const res = pointerReducer(prev, event)

			expect(hitTestMock).toHaveBeenCalledWith(prev.doc, event.position)
			expect(res.actions).toEqual([])
			expectHitTestPerf(res.perf)

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
					latestPointer: { kind: "none" },
				},
			})

			const event = pointerEventFactory({
				type: "POINTER_DOWN",
				pointerId: createPointerId("p1"),
				position: createPoint(10, 20),
			})

			const res = pointerReducer(prev, event)

			expect(res.actions).toEqual([])
			expectHitTestPerf(res.perf)

			expect(res.session.mode).toEqual({
				kind: "armed",
				pointerId: createPointerId("p1"),
				origin: event.position,
				intent: { kind: "drawRect" },
			})
			expect(res.session.hover).toEqual({ kind: "none" })
			expect(res.session.selection).toEqual({ kind: "none" })
		})

		it("if hitTest returns id but rect cannot be resolved: noop session but still emits HIT_TEST perf", () => {
			const shapeId = createShapeId("shape-1")
			hitTestMock.mockReturnValue(shapeId)

			const prev = editorStateFactory() // no shapes in doc

			const event = pointerEventFactory({
				type: "POINTER_DOWN",
				pointerId: createPointerId("p1"),
				position: createPoint(10, 10),
			})

			const res = pointerReducer(prev, event)

			expect(res.session).toBe(prev.session)
			expect(res.actions).toEqual([])
			expectHitTestPerf(res.perf)
		})
	})

	describe("POINTER_MOVE (sampling only)", () => {
		it("sets session.latestPointer and does not hitTest or change mode", () => {
			const prev = editorStateFactory({
				session: {
					...editorStateFactory().session,
					mode: { kind: "idle" },
					hover: { kind: "none" },
					latestPointer: { kind: "none" },
				},
			})

			const event = move(createPointerId("p1"), createPoint(5, 5))
			const res = pointerReducer(prev, event)

			expect(hitTestMock).not.toHaveBeenCalled()
			expect(res.actions).toEqual([])
			expect(res.perf).toEqual([])
			expect(res.session.mode).toEqual({ kind: "idle" })
			expect(res.session.latestPointer).toEqual({
				kind: "some",
				pointerId: createPointerId("p1"),
				position: createPoint(5, 5),
			})
		})
	})

	describe("FRAME_TICK", () => {
		it("idle: emits HIT_TEST perf and sets hover to shape when hitTest returns shape", () => {
			const shapeId = createShapeId("shape-1")
			hitTestMock.mockReturnValue(shapeId)

			const prev = editorStateFactory({
				session: {
					...editorStateFactory().session,
					latestPointer: { kind: "none" },
				},
			})

			// sample pointer
			const afterMove = pointerReducer(
				prev,
				move(createPointerId("p1"), createPoint(5, 5)),
			)

			const res = pointerReducer(
				{ ...prev, session: afterMove.session },
				frameTick(),
			)

			expect(hitTestMock).toHaveBeenCalledWith(prev.doc, createPoint(5, 5))
			expect(res.actions).toEqual([])
			expectHitTestPerf(res.perf)
			expect(res.session.mode).toEqual({ kind: "idle" })
			expect(res.session.hover).toEqual({ kind: "shape", id: shapeId })
		})

		it("idle: clears hover when hitTest returns null", () => {
			hitTestMock.mockReturnValue(null)

			const prev = editorStateFactory({
				session: {
					...editorStateFactory().session,
					mode: { kind: "idle" },
					hover: { kind: "shape", id: createShapeId("shape-1") },
					latestPointer: { kind: "none" },
				},
			})

			const afterMove = pointerReducer(
				prev,
				move(createPointerId("p1"), createPoint(123, 456)),
			)

			const res = pointerReducer(
				{ ...prev, session: afterMove.session },
				frameTick(),
			)

			expect(res.actions).toEqual([])
			expectHitTestPerf(res.perf)
			expect(res.session.hover).toEqual({ kind: "none" })
		})

		it("armed drawRect: stays armed until MIN_DRAG exceeded, then enters drawingRect", () => {
			hitTestMock.mockReturnValue(null)

			const prev0 = editorStateFactory({
				session: {
					...editorStateFactory().session,
					latestPointer: { kind: "none" },
				},
			})

			const down = pointerEventFactory({
				type: "POINTER_DOWN",
				pointerId: createPointerId("p1"),
				position: createPoint(0, 0),
			})
			const armedRes = pointerReducer(prev0, down)
			expect(armedRes.session.mode.kind).toBe("armed")

			// still within threshold (<=3): sample + tick => noop
			const afterSmallMove = pointerReducer(
				{ ...prev0, session: armedRes.session },
				move(createPointerId("p1"), createPoint(3, 0)),
			)
			const resSmallTick = pointerReducer(
				{ ...prev0, session: afterSmallMove.session },
				frameTick(),
			)
			expect(resSmallTick.session.mode).toEqual(armedRes.session.mode)
			expect(resSmallTick.actions).toEqual([])
			expect(resSmallTick.perf).toEqual([])

			// exceeds threshold: sample + tick => drawingRect
			const afterBigMove = pointerReducer(
				{ ...prev0, session: armedRes.session },
				move(createPointerId("p1"), createPoint(4, 0)),
			)
			const resBigTick = pointerReducer(
				{ ...prev0, session: afterBigMove.session },
				frameTick(),
			)

			expect(resBigTick.actions).toEqual([])
			expect(resBigTick.session.mode).toEqual({
				kind: "drawingRect",
				pointerId: createPointerId("p1"),
				origin: createPoint(0, 0),
				current: createPoint(4, 0),
			})
		})

		it("armed dragSelection: stays armed until MIN_DRAG exceeded, then enters draggingSelection", () => {
			const shapeId = createShapeId("shape-1")
			hitTestMock.mockReturnValue(shapeId)

			const rect: Rect = rectFactory({ x: 10, y: 20, width: 30, height: 40 })
			const prev0 = editorStateFactory({
				doc: {
					...editorStateFactory().doc,
					shapes: new Map([[shapeId, rect]]),
				},
				session: {
					...editorStateFactory().session,
					latestPointer: { kind: "none" },
				},
			})

			const down = pointerEventFactory({
				type: "POINTER_DOWN",
				pointerId: createPointerId("p1"),
				position: createPoint(0, 0),
			})
			const armedRes = pointerReducer(prev0, down)
			expect(armedRes.session.mode.kind).toBe("armed")

			// within threshold
			const afterSmallMove = pointerReducer(
				{ ...prev0, session: armedRes.session },
				move(createPointerId("p1"), createPoint(0, 3)),
			)
			const smallTick = pointerReducer(
				{ ...prev0, session: afterSmallMove.session },
				frameTick(),
			)
			expect(smallTick.session.mode).toEqual(armedRes.session.mode)
			expect(smallTick.actions).toEqual([])
			expect(smallTick.perf).toEqual([])

			// exceeds threshold: starts dragging
			const afterBigMove = pointerReducer(
				{ ...prev0, session: armedRes.session },
				move(createPointerId("p1"), createPoint(0, 4)),
			)
			const bigTick = pointerReducer(
				{ ...prev0, session: afterBigMove.session },
				frameTick(),
			)

			expect(bigTick.actions).toEqual([])
			expect(bigTick.session.mode).toEqual({
				kind: "draggingSelection",
				shapeId,
				pointerId: createPointerId("p1"),
				startPointer: createPoint(0, 0),
				currentPointer: createPoint(0, 4),
				startRect: rect,
			})
		})

		it("draggingSelection: updates currentPointer from latestPointer (no hitTest, no actions)", () => {
			const shapeId = createShapeId("shape-1")

			const prev0 = editorStateFactory({
				session: {
					...editorStateFactory().session,
					mode: {
						kind: "draggingSelection",
						shapeId,
						pointerId: createPointerId("p1"),
						startPointer: createPoint(10, 10),
						currentPointer: createPoint(10, 10),
						startRect: rectFactory({ x: 1, y: 2, width: 3, height: 4 }),
					},
					latestPointer: { kind: "none" },
				},
			})

			const afterMove = pointerReducer(
				prev0,
				move(createPointerId("p1"), createPoint(15, 5)),
			)
			const res = pointerReducer(
				{ ...prev0, session: afterMove.session },
				frameTick(),
			)

			expect(hitTestMock).not.toHaveBeenCalled()
			expect(res.actions).toEqual([])
			expect(res.perf).toEqual([])
			expect(res.session.mode).toEqual({
				...(prev0.session.mode as any),
				currentPointer: createPoint(15, 5),
			})
		})

		it("drawingRect: updates current from latestPointer and does not hitTest", () => {
			const prev0 = editorStateFactory({
				session: {
					...editorStateFactory().session,
					mode: {
						kind: "drawingRect",
						pointerId: createPointerId("p1"),
						origin: createPoint(0, 0),
						current: createPoint(1, 1),
					},
					hover: { kind: "shape", id: createShapeId("shape-1") },
					latestPointer: { kind: "none" },
				},
			})

			const afterMove = pointerReducer(
				prev0,
				move(createPointerId("p1"), createPoint(9, 9)),
			)
			const res = pointerReducer(
				{ ...prev0, session: afterMove.session },
				frameTick(),
			)

			expect(hitTestMock).not.toHaveBeenCalled()
			expect(res.actions).toEqual([])
			expect(res.perf).toEqual([])
			expect(res.session.mode).toEqual({
				kind: "drawingRect",
				pointerId: createPointerId("p1"),
				origin: createPoint(0, 0),
				current: createPoint(9, 9),
			})
			expect(res.session.hover).toEqual(prev0.session.hover)
		})
	})

	describe("POINTER_UP (commit uses bestPointerPosition)", () => {
		it("armed: returns to idle and emits no actions (matching pointerId)", () => {
			const prev = editorStateFactory({
				session: {
					...editorStateFactory().session,
					mode: {
						kind: "armed",
						pointerId: createPointerId("p1"),
						origin: createPoint(0, 0),
						intent: { kind: "drawRect" },
					},
					latestPointer: { kind: "none" },
				},
			})

			const event = pointerEventFactory({
				type: "POINTER_UP",
				pointerId: createPointerId("p1"),
				position: createPoint(0, 0),
			})

			const res = pointerReducer(prev, event)

			expect(res.actions).toEqual([])
			expect(res.perf).toEqual([])
			expect(res.session.mode).toEqual({ kind: "idle" })
		})

		it("drawingRect: uses latestPointer position if present for same pointerId", () => {
			const addAction = { type: "ADD_RECT" } as unknown as DocAction
			createAddRectMock.mockReturnValue(addAction)

			const prev = editorStateFactory({
				session: {
					...editorStateFactory().session,
					mode: {
						kind: "drawingRect",
						pointerId: createPointerId("p1"),
						origin: createPoint(0, 0),
						current: createPoint(5, 5),
					},
					latestPointer: {
						kind: "some",
						pointerId: createPointerId("p1"),
						position: createPoint(99, 99),
					},
				},
			})

			const event = pointerEventFactory({
				type: "POINTER_UP",
				pointerId: createPointerId("p1"),
				position: createPoint(5, 5),
			})

			const res = pointerReducer(prev, event)

			expect(createAddRectMock).toHaveBeenCalledWith(
				createPoint(0, 0),
				createPoint(99, 99),
			)
			expect(res.actions).toEqual([addAction])
			expect(res.perf).toEqual([])
			expect(res.session.mode).toEqual({ kind: "idle" })
		})

		it("draggingSelection: emits createUpdateRectPosition(doc, shapeId, pos) using bestPointerPosition", () => {
			const shapeId = createShapeId("shape-1")
			const startRect = rectFactory({ x: 1, y: 2, width: 3, height: 4 })

			const updateAction = { type: "UPDATE_RECT" } as unknown as DocAction
			createUpdateRectPositionMock.mockReturnValue(updateAction)

			const prev = editorStateFactory({
				session: {
					...editorStateFactory().session,
					mode: {
						kind: "draggingSelection",
						shapeId,
						pointerId: createPointerId("p1"),
						startPointer: createPoint(10, 10),
						currentPointer: createPoint(10, 10),
						startRect,
					},
					selection: { kind: "shape", id: shapeId },
					latestPointer: {
						kind: "some",
						pointerId: createPointerId("p1"),
						position: createPoint(15, 5),
					},
				},
			})

			// event.position differs; reducer should prefer latestPointer
			const event = pointerEventFactory({
				type: "POINTER_UP",
				pointerId: createPointerId("p1"),
				position: createPoint(999, 999),
			})

			const res = pointerReducer(prev, event)

			// delta = (5, -5) => pos = (1+5, 2-5) = (6, -3)
			expect(createUpdateRectPositionMock).toHaveBeenCalledWith(
				prev.doc,
				shapeId,
				{ x: 6, y: -3 },
			)
			expect(res.actions).toEqual([updateAction])
			expect(res.perf).toEqual([])
			expect(res.session.mode).toEqual({ kind: "idle" })
			expect(res.session.selection).toEqual({ kind: "shape", id: shapeId })
		})

		it("draggingSelection: if createUpdateRectPosition returns null, emits no actions", () => {
			const shapeId = createShapeId("shape-1")
			createUpdateRectPositionMock.mockReturnValue(null as any)

			const prev = editorStateFactory({
				session: {
					...editorStateFactory().session,
					mode: {
						kind: "draggingSelection",
						shapeId,
						pointerId: createPointerId("p1"),
						startPointer: createPoint(0, 0),
						currentPointer: createPoint(0, 0),
						startRect: rectFactory({ x: 10, y: 20, width: 1, height: 1 }),
					},
					latestPointer: {
						kind: "some",
						pointerId: createPointerId("p1"),
						position: createPoint(0, 10),
					},
				},
			})

			const event = pointerEventFactory({
				type: "POINTER_UP",
				pointerId: createPointerId("p1"),
				position: createPoint(0, 10),
			})

			const res = pointerReducer(prev, event)

			expect(res.actions).toEqual([])
			expect(res.perf).toEqual([])
			expect(res.session.mode).toEqual({ kind: "idle" })
		})
	})

	describe("POINTER_CANCEL", () => {
		it("idle: clears hover and returns idle (pointerId irrelevant)", () => {
			const prev = editorStateFactory({
				session: {
					...editorStateFactory().session,
					mode: { kind: "idle" },
					hover: { kind: "shape", id: createShapeId("shape-1") },
					latestPointer: { kind: "none" },
				},
			})

			const event = pointerEventFactory({
				type: "POINTER_CANCEL",
				pointerId: createPointerId("p999"),
				position: createPoint(0, 0),
			})

			const res = pointerReducer(prev, event)

			expect(res.actions).toEqual([])
			expect(res.perf).toEqual([])
			expect(res.session.mode).toEqual({ kind: "idle" })
			expect(res.session.hover).toEqual({ kind: "none" })
		})

		it("active mode: cancels to idle + clears hover only if pointerId matches", () => {
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
					latestPointer: { kind: "none" },
				},
			})

			const event = pointerEventFactory({
				type: "POINTER_CANCEL",
				pointerId: createPointerId("p1"),
				position: createPoint(999, 999),
			})

			const res = pointerReducer(prev, event)

			expect(res.actions).toEqual([])
			expect(res.perf).toEqual([])
			expect(res.session.mode).toEqual({ kind: "idle" })
			expect(res.session.hover).toEqual({ kind: "none" })
		})
	})

	describe("unknown event type", () => {
		it("noops", () => {
			const prev = editorStateFactory()
			const event = { type: "SOMETHING_ELSE" } as unknown as EditorEvent

			const res = pointerReducer(prev, event)
			expect(res.session).toBe(prev.session)
			expect(res.actions).toEqual([])
			expect(res.perf).toEqual([])
		})
	})
})
