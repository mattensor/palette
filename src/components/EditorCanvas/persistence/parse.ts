import type {
	EditorDocumentV1,
	PersistedRectV1,
} from "@/components/EditorCanvas/types"

export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E }

export type ValidationError = {
	readonly path: string
	readonly message: string
}

export type ParseWarnings = readonly string[]

function isRecord(v: unknown): v is Record<string, unknown> {
	return typeof v === "object" && v !== null
}
function isNumber(v: unknown): v is number {
	return typeof v === "number" && Number.isFinite(v)
}
function isNonEmptyString(v: unknown): v is string {
	return typeof v === "string" && v.length > 0
}
function push(errors: ValidationError[], path: string, message: string) {
	errors.push({ path, message })
}

function parseHeader(
	raw: unknown,
): Result<{ shapesRaw: unknown[]; orderRaw: unknown[] }, ValidationError[]> {
	if (!isRecord(raw)) {
		return {
			ok: false,
			error: [{ path: "", message: "Expected an object at root" }],
		}
	}

	if (raw.version !== 1) {
		return {
			ok: false,
			error: [{ path: "version", message: "Expected version === 1" }],
		}
	}

	if (!Array.isArray(raw.shapes)) {
		return {
			ok: false,
			error: [{ path: "shapes", message: "Expected shapes to be an array" }],
		}
	}

	if (!Array.isArray(raw.shapeOrder)) {
		return {
			ok: false,
			error: [
				{ path: "shapeOrder", message: "Expected shapeOrder to be an array" },
			],
		}
	}

	return {
		ok: true,
		value: { shapesRaw: raw.shapes, orderRaw: raw.shapeOrder },
	}
}

function parseShapes(
	shapesRaw: unknown[],
): Result<{ shapes: PersistedRectV1[]; ids: Set<string> }, ValidationError[]> {
	const errors: ValidationError[] = []
	const shapes: PersistedRectV1[] = []
	const ids = new Set<string>()

	for (let i = 0; i < shapesRaw.length; i++) {
		const s = shapesRaw[i]
		const base = `shapes[${i}]`

		if (!isRecord(s)) {
			push(errors, base, "Expected shape to be an object")
			continue
		}

		const id = s.id
		const x = s.x
		const y = s.y
		const width = s.width
		const height = s.height

		if (!isNonEmptyString(id))
			push(errors, `${base}.id`, "Expected non-empty string id")
		if (!isNumber(x)) push(errors, `${base}.x`, "Expected finite number")
		if (!isNumber(y)) push(errors, `${base}.y`, "Expected finite number")
		if (!isNumber(width) || width < 0)
			push(errors, `${base}.width`, "Expected finite number >= 0")
		if (!isNumber(height) || height < 0)
			push(errors, `${base}.height`, "Expected finite number >= 0")

		const ok =
			isNonEmptyString(id) &&
			isNumber(x) &&
			isNumber(y) &&
			isNumber(width) &&
			isNumber(height) &&
			width >= 0 &&
			height >= 0

		if (!ok) continue

		if (ids.has(id)) {
			push(errors, `${base}.id`, "Duplicate shape id")
			continue
		}

		ids.add(id)
		shapes.push({ id, x, y, width, height })
	}

	if (errors.length > 0) return { ok: false, error: errors }
	return { ok: true, value: { shapes, ids } }
}

function normaliseOrder(
	orderRaw: unknown[],
	ids: Set<string>,
): Result<{ shapeOrder: string[]; warnings: string[] }, ValidationError[]> {
	const errors: ValidationError[] = []
	const warnings: string[] = []
	const seen = new Set<string>()
	const shapeOrder: string[] = []

	for (let i = 0; i < orderRaw.length; i++) {
		const id = orderRaw[i]
		const path = `shapeOrder[${i}]`

		if (!isNonEmptyString(id)) {
			push(errors, path, "Expected non-empty string id")
			continue
		}

		if (seen.has(id)) {
			warnings.push(`Deduped duplicate id in shapeOrder: "${id}"`)
			continue
		}
		seen.add(id)

		if (!ids.has(id)) {
			warnings.push(`Dropped unknown id from shapeOrder: "${id}"`)
			continue
		}

		shapeOrder.push(id)
	}

	if (errors.length > 0) return { ok: false, error: errors }

	// Append any ids missing from order (minimal repair)
	if (shapeOrder.length !== ids.size) {
		for (const id of ids) {
			if (!seen.has(id)) shapeOrder.push(id)
		}
		warnings.push(
			"shapeOrder was missing ids; appended missing shapes to the end",
		)
	}

	return { ok: true, value: { shapeOrder, warnings } }
}

export function parseDocument(
	raw: unknown,
): Result<
	{ doc: EditorDocumentV1; warnings: ParseWarnings },
	ValidationError[]
> {
	const header = parseHeader(raw)
	if (!header.ok) return header

	const { shapesRaw, orderRaw } = header.value

	const parsedShapes = parseShapes(shapesRaw)
	if (!parsedShapes.ok) return parsedShapes

	const { shapes, ids } = parsedShapes.value

	const order = normaliseOrder(orderRaw, ids)
	if (!order.ok) return order

	const { shapeOrder, warnings } = order.value

	const doc: EditorDocumentV1 = {
		version: 1,
		shapes,
		shapeOrder,
	}

	return { ok: true, value: { doc, warnings } }
}
