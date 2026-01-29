import type { EditorState } from "@/components/EditorCanvas/types"
import { debugFactory } from "@/factories/debugFactory"
import { docFactory } from "@/factories/docFactory"
import { historyFactory } from "@/factories/historyFactory"
import { sessionFactory } from "@/factories/sessionFactory"

export function editorStateFactory(
	overrides: Partial<EditorState> = {},
): EditorState {
	return {
		doc: docFactory(),
		session: sessionFactory(),
		debug: debugFactory(),
		history: historyFactory(),
		...overrides,
	}
}
