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

function withHitTests(
	prev: ReturnType<typeof editorStateFactory>,
	hitTests: number,
) {
	return {
		...prev,
		debug: {
			...prev.debug,
			metrics: {
				...prev.debug.metrics,
				hitTests,
			},
		},
	}
}

describe("pointerReducer", () => {
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
			expect(res.debug).toBe(prev.debug)
			expect(res.actions).toEqual([])
		})

		it("arms dragSelection + selects shape when clicking on a shape (hitTest returns id)", () => {
			const shapeId = createShapeId("shape-1")
			hitTestMock.mockReturnValue(shapeId)

			const rect: Rect = rectFactory({ x: 10, y: 20, width: 30, height: 40 })
			const prev0 = editorStateFactory({
				doc: {
					...editorStateFactory().doc,
					shapes: new Map([[shapeId, rect]]),
				},
			})
			const prev = withHitTests(prev0, 0)

			const event = pointerEventFactory({
				type: "POINTER_DOWN",
				pointerId: createPointerId("p1"),
				position: createPoint(10, 10),
			})

			const res = pointerReducer(prev, event)

			expect(hitTestMock).toHaveBeenCalledWith(prev.doc, event.position)
			expect(res.actions).toEqual([])
			expect(res.debug.metrics.hitTests).toBe(1)

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

			const prev0 = editorStateFactory({
				session: {
					...editorStateFactory().session,
					hover: { kind: "shape", id: createShapeId("old-hover") },
					selection: { kind: "shape", id: createShapeId("old-selection") },
				},
			})
			const prev = withHitTests(prev0, 7)

			const event = pointerEventFactory({
				type: "POINTER_DOWN",
				pointerId: createPointerId("p1"),
				position: createPoint(10, 20),
			})

			const res = pointerReducer(prev, event)

			expect(res.actions).toEqual([])
			expect(res.debug.metrics.hitTests).toBe(8)

			expect(res.session.mode).toEqual({
				kind: "armed",
				pointerId: createPointerId("p1"),
				origin: event.position,
				intent: { kind: "drawRect" },
			})
			expect(res.session.hover).toEqual({ kind: "none" })
			expect(res.session.selection).toEqual({ kind: "none" })
		})

		it("if hitTest returns id but rect cannot be resolved: noop session but hitTests still increments", () => {
			const shapeId = createShapeId("shape-1")
			hitTestMock.mockReturnValue(shapeId)

			const prev0 = editorStateFactory() // no shapes in doc
			const prev = withHitTests(prev0, 2)

			const event = pointerEventFactory({
				type: "POINTER_DOWN",
				pointerId: createPointerId("p1"),
				position: createPoint(10, 10),
			})

			const res = pointerReducer(prev, event)

			expect(res.session).toBe(prev.session) // noop path
			expect(res.actions).toEqual([])
			expect(res.debug.metrics.hitTests).toBe(3)
		})
	})

	describe("POINTER_MOVE", () => {
		it("when idle: sets hover to shape when hitTest returns shape", () => {
			const shapeId = createShapeId("shape-1")
			hitTestMock.mockReturnValue(shapeId)

			const prev0 = editorStateFactory()
			const prev = withHitTests(prev0, 0)

			const event = pointerEventFactory({
				type: "POINTER_MOVE",
				pointerId: createPointerId("p1"),
				position: createPoint(5, 5),
			})

			const res = pointerReducer(prev, event)

			expect(hitTestMock).toHaveBeenCalledWith(prev.doc, event.position)
			expect(res.actions).toEqual([])
			expect(res.debug.metrics.hitTests).toBe(1)
			expect(res.session.mode).toEqual({ kind: "idle" })
			expect(res.session.hover).toEqual({ kind: "shape", id: shapeId })
		})

		it("when idle: clears hover when hitTest returns null", () => {
			hitTestMock.mockReturnValue(null)

			const prev0 = editorStateFactory({
				session: {
					...editorStateFactory().session,
					hover: { kind: "shape", id: createShapeId("shape-1") },
				},
			})
			const prev = withHitTests(prev0, 3)

			const event = pointerEventFactory({
				type: "POINTER_MOVE",
				pointerId: createPointerId("p1"),
				position: createPoint(123, 456),
			})

			const res = pointerReducer(prev, event)

			expect(res.actions).toEqual([])
			expect(res.debug.metrics.hitTests).toBe(4)
			expect(res.session.hover).toEqual({ kind: "none" })
		})

		it("when idle: hover already same shape => session noops but debug still updates", () => {
			const shapeId = createShapeId("shape-1")
			hitTestMock.mockReturnValue(shapeId)

			const prev0 = editorStateFactory({
				session: {
					...editorStateFactory().session,
					hover: { kind: "shape", id: shapeId },
				},
			})
			const prev = withHitTests(prev0, 10)

			const event = pointerEventFactory({
				type: "POINTER_MOVE",
				pointerId: createPointerId("p1"),
				position: createPoint(9, 9),
			})

			const res = pointerReducer(prev, event)

			expect(res.session).toBe(prev.session) // noop session
			expect(res.actions).toEqual([])
			expect(res.debug).not.toBe(prev.debug) // debug changed (hitTests increment)
			expect(res.debug.metrics.hitTests).toBe(11)
		})

		it("when idle: hover already none + hitTest null => session noops but debug still updates", () => {
			hitTestMock.mockReturnValue(null)

			const prev0 = editorStateFactory({
				session: { ...editorStateFactory().session, hover: { kind: "none" } },
			})
			const prev = withHitTests(prev0, 1)

			const event = pointerEventFactory({
				type: "POINTER_MOVE",
				pointerId: createPointerId("p1"),
				position: createPoint(1, 2),
			})

			const res = pointerReducer(prev, event)

			expect(res.session).toBe(prev.session)
			expect(res.actions).toEqual([])
			expect(res.debug.metrics.hitTests).toBe(2)
		})

		it("armed drawRect: noops for non-active pointerId", () => {
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

			const event = pointerEventFactory({
				type: "POINTER_MOVE",
				pointerId: createPointerId("p2"),
				position: createPoint(10, 0),
			})

			const res = pointerReducer(prev, event)
			expect(res.session).toBe(prev.session)
			expect(res.actions).toEqual([])
		})

		it("armed drawRect: noops until MIN_DRAG exceeded, then enters drawingRect", () => {
			hitTestMock.mockReturnValue(null)
			const prev0 = withHitTests(editorStateFactory(), 0)

			const down = pointerEventFactory({
				type: "POINTER_DOWN",
				pointerId: createPointerId("p1"),
				position: createPoint(0, 0),
			})
			const armedRes = pointerReducer(prev0, down)
			expect(armedRes.session.mode.kind).toBe("armed")

			// still within threshold (<= 3px delta): noop
			const moveSmall = pointerEventFactory({
				type: "POINTER_MOVE",
				pointerId: createPointerId("p1"),
				position: createPoint(3, 0),
			})
			const resSmall = pointerReducer(
				{ ...prev0, session: armedRes.session, debug: armedRes.debug },
				moveSmall,
			)
			expect(resSmall.session).toBe(armedRes.session)
			expect(resSmall.actions).toEqual([])

			// exceeds threshold
			const moveBig = pointerEventFactory({
				type: "POINTER_MOVE",
				pointerId: createPointerId("p1"),
				position: createPoint(4, 0),
			})
			const resBig = pointerReducer(
				{ ...prev0, session: armedRes.session, debug: armedRes.debug },
				moveBig,
			)

			expect(resBig.actions).toEqual([])
			expect(resBig.session.mode).toEqual({
				kind: "drawingRect",
				pointerId: createPointerId("p1"),
				origin: createPoint(0, 0),
				current: createPoint(4, 0),
			})
		})

		it("armed dragSelection: noops until MIN_DRAG exceeded, then enters draggingSelection (no actions yet)", () => {
			const shapeId = createShapeId("shape-1")
			hitTestMock.mockReturnValue(shapeId)

			const rect: Rect = rectFactory({ x: 10, y: 20, width: 30, height: 40 })
			const prev0 = withHitTests(
				editorStateFactory({
					doc: {
						...editorStateFactory().doc,
						shapes: new Map([[shapeId, rect]]),
					},
				}),
				0,
			)

			const down = pointerEventFactory({
				type: "POINTER_DOWN",
				pointerId: createPointerId("p1"),
				position: createPoint(0, 0),
			})
			const armedRes = pointerReducer(prev0, down)
			expect(armedRes.session.mode.kind).toBe("armed")

			// within threshold: noop
			const moveSmall = pointerEventFactory({
				type: "POINTER_MOVE",
				pointerId: createPointerId("p1"),
				position: createPoint(0, 3),
			})
			const resSmall = pointerReducer(
				{ ...prev0, session: armedRes.session, debug: armedRes.debug },
				moveSmall,
			)
			expect(resSmall.session).toBe(armedRes.session)
			expect(resSmall.actions).toEqual([])

			// exceeds threshold: starts dragging (still no actions)
			const moveBig = pointerEventFactory({
				type: "POINTER_MOVE",
				pointerId: createPointerId("p1"),
				position: createPoint(0, 4),
			})
			const resBig = pointerReducer(
				{ ...prev0, session: armedRes.session, debug: armedRes.debug },
				moveBig,
			)

			expect(resBig.actions).toEqual([])
			expect(resBig.session.mode).toEqual({
				kind: "draggingSelection",
				shapeId,
				pointerId: createPointerId("p1"),
				startPointer: createPoint(0, 0),
				currentPointer: createPoint(0, 4),
				startRect: rect,
			})
		})

		it("draggingSelection: updates currentPointer (no hitTest, no actions)", () => {
			const shapeId = createShapeId("shape-1")
			const prev = editorStateFactory({
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
				},
			})

			const event = pointerEventFactory({
				type: "POINTER_MOVE",
				pointerId: createPointerId("p1"),
				position: createPoint(15, 5),
			})

			const res = pointerReducer(prev, event)

			expect(hitTestMock).not.toHaveBeenCalled()
			expect(res.actions).toEqual([])
			expect(res.session.mode).toEqual({
				...(prev.session.mode as any),
				currentPointer: createPoint(15, 5),
			})
		})

		it("drawingRect: updates current for matching pointerId and does not hitTest", () => {
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

			const event = pointerEventFactory({
				type: "POINTER_MOVE",
				pointerId: createPointerId("p1"),
				position: createPoint(9, 9),
			})

			const res = pointerReducer(prev, event)

			expect(hitTestMock).not.toHaveBeenCalled()
			expect(res.actions).toEqual([])
			expect(res.session.mode).toEqual({
				kind: "drawingRect",
				pointerId: createPointerId("p1"),
				origin: createPoint(0, 0),
				current: createPoint(9, 9),
			})
			expect(res.session.hover).toEqual(prev.session.hover)
		})
	})

	describe("POINTER_UP", () => {
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
				},
			})

			const event = pointerEventFactory({
				type: "POINTER_UP",
				pointerId: createPointerId("p1"),
				position: createPoint(0, 0),
			})

			const res = pointerReducer(prev, event)

			expect(res.actions).toEqual([])
			expect(res.session.mode).toEqual({ kind: "idle" })
		})

		it("drawingRect: ends drawing, returns idle, and emits createAddRect(origin, position)", () => {
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
				createPoint(5, 5),
			)
			expect(res.actions).toEqual([addAction])
			expect(res.session.mode).toEqual({ kind: "idle" })
		})

		it("draggingSelection: ends drag, returns idle, and emits createUpdateRectPosition(doc, shapeId, pos) if action exists", () => {
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
				},
			})

			const event = pointerEventFactory({
				type: "POINTER_UP",
				pointerId: createPointerId("p1"),
				position: createPoint(15, 5),
			})

			const res = pointerReducer(prev, event)

			// delta = (5, -5) => pos = (1+5, 2-5) = (6, -3)
			expect(createUpdateRectPositionMock).toHaveBeenCalledWith(
				prev.doc,
				shapeId,
				{
					x: 6,
					y: -3,
				},
			)
			expect(res.actions).toEqual([updateAction])
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
				},
			})

			const event = pointerEventFactory({
				type: "POINTER_UP",
				pointerId: createPointerId("p1"),
				position: createPoint(0, 10),
			})

			const res = pointerReducer(prev, event)

			expect(res.actions).toEqual([])
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
				},
			})

			const event = pointerEventFactory({
				type: "POINTER_CANCEL",
				pointerId: createPointerId("p999"),
				position: createPoint(0, 0),
			})

			const res = pointerReducer(prev, event)

			expect(res.actions).toEqual([])
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
				},
			})

			const event = pointerEventFactory({
				type: "POINTER_CANCEL",
				pointerId: createPointerId("p1"),
				position: createPoint(999, 999),
			})

			const res = pointerReducer(prev, event)

			expect(res.actions).toEqual([])
			expect(res.session.mode).toEqual({ kind: "idle" })
			expect(res.session.hover).toEqual({ kind: "none" })
		})
	})

	describe("unknown event type", () => {
		it("noops", () => {
			const prev = editorStateFactory()
			const event = { type: "SOMETHING_ELSE" } as unknown as PointerEditorEvent

			const res = pointerReducer(prev, event)
			expect(res.session).toBe(prev.session)
			expect(res.debug).toBe(prev.debug)
			expect(res.actions).toEqual([])
		})
	})
})
