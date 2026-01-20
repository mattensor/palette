import type { EditorState } from "@/components/EditorCanvas/types"
import { debugFactory } from "@/factories/debugFactory"
import { docFactory } from "@/factories/docFactory"
import { sessionFactory } from "@/factories/sessionFactory"

export function editorStateFactory(
	overrides: Partial<EditorState> = {},
): EditorState {
	return {
		doc: docFactory(),
		session: sessionFactory(),
		debug: debugFactory(),
		...overrides,
	}
}
