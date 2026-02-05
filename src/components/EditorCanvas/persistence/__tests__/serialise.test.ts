import { describe, expect, it } from "vitest"
import type { EditorDocumentV1 } from "@/components/EditorCanvas/types"
import { parseDocument } from "../parse"

describe("parseDocument", () => {
	it("parses a valid document", () => {
		const raw = {
			version: 1,
			shapes: [
				{ id: "a", x: 0, y: 0, width: 10, height: 10 },
				{ id: "b", x: 20, y: 20, width: 5, height: 5 },
			],
			shapeOrder: ["a", "b"],
		}

		const result = parseDocument(raw)

		expect(result.ok).toBe(true)
		if (!result.ok) return

		const { doc, warnings } = result.value

		expect(warnings).toEqual([])
		expect(doc).toEqual<EditorDocumentV1>({
			version: 1,
			shapes: raw.shapes,
			shapeOrder: ["a", "b"],
		})
	})

	it("rejects non-object input", () => {
		const result = parseDocument(null)

		expect(result.ok).toBe(false)
		if (result.ok) return

		expect(result.error[0].message).toMatch(/Expected an object/)
	})

	it("rejects wrong version", () => {
		const result = parseDocument({
			version: 2,
			shapes: [],
			shapeOrder: [],
		})

		expect(result.ok).toBe(false)
		if (result.ok) return

		expect(result.error[0]).toEqual({
			path: "version",
			message: "Expected version === 1",
		})
	})

	it("rejects duplicate shape ids", () => {
		const result = parseDocument({
			version: 1,
			shapes: [
				{ id: "a", x: 0, y: 0, width: 10, height: 10 },
				{ id: "a", x: 5, y: 5, width: 5, height: 5 },
			],
			shapeOrder: ["a"],
		})

		expect(result.ok).toBe(false)
		if (result.ok) return

		expect(
			result.error.some((e) => e.message.includes("Duplicate shape id")),
		).toBe(true)
	})

	it("drops unknown ids from shapeOrder with warning", () => {
		const result = parseDocument({
			version: 1,
			shapes: [{ id: "a", x: 0, y: 0, width: 10, height: 10 }],
			shapeOrder: ["a", "ghost"],
		})

		expect(result.ok).toBe(true)
		if (!result.ok) return

		expect(result.value.doc.shapeOrder).toEqual(["a"])
		expect(
			result.value.warnings.some((w) => w.includes("Dropped unknown id")),
		).toBe(true)
	})

	it("dedupes duplicate ids in shapeOrder with warning", () => {
		const result = parseDocument({
			version: 1,
			shapes: [{ id: "a", x: 0, y: 0, width: 10, height: 10 }],
			shapeOrder: ["a", "a", "a"],
		})

		expect(result.ok).toBe(true)
		if (!result.ok) return

		expect(result.value.doc.shapeOrder).toEqual(["a"])
		expect(result.value.warnings.some((w) => w.includes("Deduped"))).toBe(true)
	})

	it("appends missing ids to shapeOrder deterministically", () => {
		const result = parseDocument({
			version: 1,
			shapes: [
				{ id: "a", x: 0, y: 0, width: 10, height: 10 },
				{ id: "b", x: 5, y: 5, width: 5, height: 5 },
			],
			shapeOrder: ["a"],
		})

		expect(result.ok).toBe(true)
		if (!result.ok) return

		expect(result.value.doc.shapeOrder).toEqual(["a", "b"])
		expect(result.value.warnings.some((w) => w.includes("missing ids"))).toBe(
			true,
		)
	})

	it("rejects invalid shape fields", () => {
		const result = parseDocument({
			version: 1,
			shapes: [{ id: "a", x: "nope", y: 0, width: 10, height: 10 }],
			shapeOrder: ["a"],
		})

		expect(result.ok).toBe(false)
		if (result.ok) return

		expect(result.error.some((e) => e.path === "shapes[0].x")).toBe(true)
	})
})
