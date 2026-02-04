import type { DocPatch } from "./actions"
import type { DocumentState } from "./domain"
import type { SessionState } from "./interaction"

export type History = {
	past: readonly DocPatch[]
	future: readonly DocPatch[]
}

export type EditorState = {
	doc: DocumentState
	session: SessionState
	history: History
}
