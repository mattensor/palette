import { describe, expect, it } from "vitest"
import { createDebugRecorder } from "@/components/EditorCanvas/debug/createDebugRecorder"
import type {
	DocAction,
	DocPatch,
} from "@/components/EditorCanvas/types/actions"
// helpers: build minimal core EditorState objects
import type { EditorState } from "@/components/EditorCanvas/types/core"
import type { ShapeId } from "@/components/EditorCanvas/types/domain"

const createShapeId = (s: string) => s as unknown as ShapeId

function makeCore(overrides: Partial<EditorState> = {}): EditorState {
	const base: EditorState = {
		doc: {
			shapes: new Map(),
			shapeOrder: [],
		},
		history: {
			past: [],
			future: [],
		},
		session: {
			mode: { kind: "idle" },
			selection: { kind: "none" },
			hover: { kind: "none" },
			latestPointer: { kind: "none" },
		},
	}

	return {
		...base,
		...overrides,
		// merge nested pieces carefully if provided
		doc: overrides.doc ?? base.doc,
		history: overrides.history ?? base.history,
		session: overrides.session ?? base.session,
	}
}

function commit(patch: DocPatch): DocAction {
	return { type: "COMMIT", patch }
}

describe("createDebugRecorder", () => {
	it("beginFrame resets hitTestsThisFrame", () => {
		const r = createDebugRecorder()

		// simulate some perf events
		r.recordPerf([{ type: "HIT_TEST", ms: 0 }])
		expect(r.snapshot(makeCore()).metrics.hitTestsThisFrame).toBe(1)

		r.beginFrame()
		expect(r.snapshot(makeCore()).metrics.hitTestsThisFrame).toBe(0)
	})

	it("recordMoveCoalesce updates movesDropped and queueLength (ignores kept)", () => {
		const r = createDebugRecorder()

		r.recordMoveCoalesce({ dropped: 3, kept: 999, queueLength: 12 })
		const snap = r.snapshot(makeCore())

		expect(snap.metrics.movesDropped).toBe(3)
		expect(snap.metrics.queueLength).toBe(12)
	})

	it("recordPerf increments hitTestsThisFrame for HIT_TEST", () => {
		const r = createDebugRecorder()
		r.beginFrame()

		r.recordPerf([
			{ type: "HIT_TEST", ms: 0 },
			{ type: "HIT_TEST", ms: 0 },
		])
		const snap = r.snapshot(makeCore())

		expect(snap.metrics.hitTestsThisFrame).toBe(2)
	})

	it("recordRender writes lastRenderMs", () => {
		const r = createDebugRecorder()
		r.recordRender(4.2)

		const snap = r.snapshot(makeCore())
		expect(snap.metrics.lastRenderMs).toBe(4.2)
	})

	it("endFrame sets frameMsLast and updates frameMsAvg (EMA)", () => {
		const r = createDebugRecorder()

		// first sample: avg becomes last
		r.endFrame(10)
		let snap = r.snapshot(makeCore())
		expect(snap.metrics.frameMsLast).toBe(10)
		expect(snap.metrics.frameMsAvg).toBe(10)

		// second sample with alpha=0.1:
		// avg = 10 + 0.1*(20-10) = 11
		r.endFrame(20)
		snap = r.snapshot(makeCore())
		expect(snap.metrics.frameMsLast).toBe(20)
		expect(snap.metrics.frameMsAvg).toBeCloseTo(11, 5)
	})

	it("snapshot computes shapeCount from doc.shapes.size and historyInfo from history", () => {
		const r = createDebugRecorder()

		const s1 = makeCore({
			doc: {
				shapes: new Map([
					[
						createShapeId("a"),
						{ id: createShapeId("a"), x: 0, y: 0, width: 1, height: 1 },
					],
					[
						createShapeId("b"),
						{ id: createShapeId("b"), x: 0, y: 0, width: 1, height: 1 },
					],
				]),
				shapeOrder: [createShapeId("a"), createShapeId("b")],
			},
			history: {
				past: [
					{
						type: "ADD_RECT",
						after: { id: createShapeId("a"), x: 0, y: 0, width: 1, height: 1 },
					},
				],
				future: [
					{
						type: "REMOVE_RECT",
						before: { id: createShapeId("a"), x: 0, y: 0, width: 1, height: 1 },
					},
				],
			},
		})

		const snap = r.snapshot(s1)

		expect(snap.metrics.shapeCount).toBe(2)
		expect(snap.historyInfo.depth).toBe(1)
		expect(snap.historyInfo.canUndo).toBe(true)
		expect(snap.historyInfo.canRedo).toBe(true)
	})

	it("recordTransition logs mode/hover/selection changes", () => {
		const r = createDebugRecorder()

		const prev = makeCore({
			session: {
				...makeCore().session,
				mode: { kind: "idle" },
				hover: { kind: "none" },
				selection: { kind: "none" },
			},
		})

		const next = makeCore({
			session: {
				...prev.session,
				mode: {
					kind: "armed",
					pointerId: 1 as any,
					origin: { x: 0, y: 0 },
					intent: { kind: "drawRect" },
				},
				hover: { kind: "shape", id: createShapeId("s1") },
				selection: { kind: "shape", id: createShapeId("s1") },
			},
		})

		r.recordTransition({ prev, next, actions: [] })
		const snap = r.snapshot(next)

		const names = snap.devLog.map((e) => e.name)
		expect(names).toContain("session/mode_changed")
		expect(names).toContain("session/hover_changed")
		expect(names).toContain("session/selection_changed")
	})

	it("recordTransition logs history/undo and history/redo", () => {
		const r = createDebugRecorder()
		const core = makeCore()

		r.recordTransition({ prev: core, next: core, actions: [{ type: "UNDO" }] })
		r.recordTransition({ prev: core, next: core, actions: [{ type: "REDO" }] })

		const names = r.snapshot(core).devLog.map((e) => e.name)
		expect(names).toContain("history/undo")
		expect(names).toContain("history/redo")
	})

	it("recordTransition logs COMMIT + doc events (ADD_RECT)", () => {
		const r = createDebugRecorder()
		const core = makeCore()

		const rect = {
			id: createShapeId("shape-1"),
			x: 1,
			y: 2,
			width: 3,
			height: 4,
		}
		const patch: DocPatch = { type: "ADD_RECT", after: rect }

		r.recordTransition({ prev: core, next: core, actions: [commit(patch)] })

		const log = r.snapshot(core).devLog
		const names = log.map((e) => e.name)

		expect(names).toContain("history/commit")
		expect(names).toContain("doc/rect_added")

		// optional: verify commit payload includes patch summary
		const commitEntry = log.find((e) => e.name === "history/commit")
		expect(commitEntry?.data).toEqual(
			expect.objectContaining({ type: "ADD_RECT", id: rect.id }),
		)

		const addedEntry = log.find((e) => e.name === "doc/rect_added")
		expect(addedEntry?.data).toEqual(expect.objectContaining({ id: rect.id }))
	})

	it("recordTransition logs COMMIT + doc events (REMOVE_RECT)", () => {
		const r = createDebugRecorder()
		const core = makeCore()

		const rect = {
			id: createShapeId("shape-1"),
			x: 1,
			y: 2,
			width: 3,
			height: 4,
		}
		const patch: DocPatch = { type: "REMOVE_RECT", before: rect }

		r.recordTransition({ prev: core, next: core, actions: [commit(patch)] })

		const names = r.snapshot(core).devLog.map((e) => e.name)
		expect(names).toContain("history/commit")
		expect(names).toContain("doc/rect_removed")
	})

	it("recordTransition logs COMMIT + doc events (UPDATE_RECT)", () => {
		const r = createDebugRecorder()
		const core = makeCore()

		const before = {
			id: createShapeId("shape-1"),
			x: 0,
			y: 0,
			width: 3,
			height: 4,
		}
		const after = { id: before.id, x: 9, y: 9, width: 3, height: 4 }

		const patch: DocPatch = {
			type: "UPDATE_RECT",
			id: before.id,
			before,
			after,
		}

		r.recordTransition({ prev: core, next: core, actions: [commit(patch)] })

		const names = r.snapshot(core).devLog.map((e) => e.name)
		expect(names).toContain("history/commit")
		expect(names).toContain("doc/rect_updated")
	})

	it("devLog is capped at DEVLOG_MAX", () => {
		const r = createDebugRecorder()
		const core = makeCore()

		// spam > DEVLOG_MAX entries
		for (let i = 0; i < 250; i++) {
			r.recordTransition({
				prev: core,
				next: core,
				actions: [{ type: "UNDO" }],
			})
		}

		const snap = r.snapshot(core)
		expect(snap.devLog.length).toBeLessThanOrEqual(200)
	})
})
