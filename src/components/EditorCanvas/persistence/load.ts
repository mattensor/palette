import { parseDocument } from "@/components/EditorCanvas/persistence/parse"
import {
	loadBackupRaw,
	loadRaw,
} from "@/components/EditorCanvas/persistence/raw"
import { fromPersisted } from "@/components/EditorCanvas/persistence/serialise"
import { createEmptyDocument } from "@/components/EditorCanvas/reducer/createInitialState"
import type { DocumentState } from "@/components/EditorCanvas/types"

export function load(): {
	doc: DocumentState
	recovered: boolean
} {
	const raw = loadRaw()

	if (raw) {
		const parsed = parseDocument(raw)
		if (parsed.ok) {
			return {
				doc: fromPersisted(parsed.value.doc),
				recovered: false,
			}
		}
	}

	const backupRaw = loadBackupRaw()
	if (backupRaw) {
		const parsed = parseDocument(backupRaw)
		if (parsed.ok) {
			return {
				doc: fromPersisted(parsed.value.doc),
				recovered: true,
			}
		}
	}

	return {
		doc: createEmptyDocument(),
		recovered: false,
	}
}
