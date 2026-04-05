import type { Stage } from "@/types/stage"
import { create } from "zustand"

type GlobalStore = {
	error: string | null
	setError: (error: string) => void
	passedStages: Set<Stage>
	setPassedStages: (passedStages: Set<Stage>) => void
}

export const useGlobalStore = create<GlobalStore>(set => ({
	error: null,
	setError: error => set({ error }),
	passedStages: new Set<Stage>(["start"]),
	setPassedStages: passedStages => set({ passedStages }),
}))
