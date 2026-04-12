import type { CheckKey, Checks } from "@/types/checks"
import type { Stage } from "@/types/stage"
import { create } from "zustand"

type GlobalStore = {
	error: string | null
	setError: (error: string) => void
	checks: Checks
	setCheck: (key: CheckKey, value: string) => void
	passedStages: Set<Stage>
	markStage: (stage: Stage) => void
}

export const useGlobalStore = create<GlobalStore>((set) => ({
	error: null,
	setError: (error) => set({ error }),
	checks: {
		azureCliPath: null,
		azureDevopsPath: null,
		azureDevopsUsername: null,
		clockifyApiKey: null,
		clockifyUserId: null,
		clockifyWorkspaceId: null,
	},
	setCheck: (key, value) =>
		set((state) => ({
			checks: {
				...state.checks,
				[key]: value,
			},
		})),
	passedStages: new Set<Stage>(["start"]),
	markStage: (stage) =>
		set((state) => ({
			passedStages: new Set(state.passedStages).add(stage),
		})),
}))
