import type { SessionState } from "@/components/EditorCanvas/types"

export function sessionFactory(
	overrides: Partial<SessionState> = {},
): SessionState {
	return {
		mode: { kind: "idle" },
		selection: { kind: "none" },
		hover: { kind: "none" },
		...overrides,
	}
}
