import type { DocPatch, Rect, ShapeId } from "@/components/EditorCanvas/types"

export const docPatchFactory = {
	addRect(after?: Rect): DocPatch {
		const rect = after ?? ({} as Rect)
		return { type: "ADD_RECT", after: rect }
	},

	removeRect(before?: Rect): DocPatch {
		const rect = before ?? ({} as Rect)
		return { type: "REMOVE_RECT", before: rect }
	},

	updateRect(args?: { id: ShapeId; before: Rect; after: Rect }): DocPatch {
		if (!args) {
			return {
				type: "UPDATE_RECT",
				id: "shape-1" as ShapeId,
				before: {} as Rect,
				after: {} as Rect,
			}
		}
		return {
			type: "UPDATE_RECT",
			id: args.id,
			before: args.before,
			after: args.after,
		}
	},
} as const
