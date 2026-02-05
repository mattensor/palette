import type { EditorDocumentV1 } from "@/components/EditorCanvas/types"

const KEY = "palette:doc"
const BACKUP_KEY = "palette:doc:backup"

export function loadRaw(): unknown | null {
	try {
		const raw = localStorage.getItem(KEY)
		return raw ? JSON.parse(raw) : null
	} catch {
		return null
	}
}

export function loadBackupRaw(): unknown | null {
	try {
		const raw = localStorage.getItem(BACKUP_KEY)
		return raw ? JSON.parse(raw) : null
	} catch {
		return null
	}
}

export function saveRaw(doc: EditorDocumentV1): void {
	try {
		const current = localStorage.getItem(KEY)
		if (current) localStorage.setItem(BACKUP_KEY, current)

		const raw = JSON.stringify(doc)
		localStorage.setItem(KEY, raw)
	} catch {
		// swallow error here
	}
}
