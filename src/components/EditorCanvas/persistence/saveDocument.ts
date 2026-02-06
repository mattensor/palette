import { saveRaw } from "@/components/EditorCanvas/persistence/raw"
import { toPersisted } from "@/components/EditorCanvas/persistence/serialise"
import type { DocumentState } from "@/components/EditorCanvas/types"

export function saveDocument(doc: DocumentState): void {
	const serialised = toPersisted(doc)

	saveRaw(serialised)
}
