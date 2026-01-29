import type { DocAction, DocPatch } from "@/components/EditorCanvas/types"

export const docActionFactory = {
	commit(patch: DocPatch): DocAction {
		return { type: "COMMIT", patch }
	},
	undo(): DocAction {
		return { type: "UNDO" }
	},
	redo(): DocAction {
		return { type: "REDO" }
	},
} as const
