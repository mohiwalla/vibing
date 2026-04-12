import type { CheckKey, Checks } from "@/types/checks"
import type { CheckStatus, FailedTask, PromptConfig } from "@/types/setup"
import type { Stage } from "@/types/stage"
import { create } from "zustand"

type WorkflowState = {
	runningTask: string | null
	runningLabel: string
	activePrompt: PromptConfig | null
	promptValue: string
	failedTask: FailedTask | null
	savedRcPath: string | null
	statusNote: string | null
	lastClockifyLookupApiKey: string | null
}

type GlobalStore = {
	error: string | null
	setError: (error: string | null) => void
	checks: Checks
	checkStatus: Record<CheckKey, CheckStatus>
	startCheck: (key: CheckKey) => void
	resolveCheck: (key: CheckKey, value: string) => void
	setCheck: (key: CheckKey, value: string) => void
	osSupported: boolean | null
	setOsSupported: (value: boolean) => void
	brewPath: string | null
	setBrewPath: (path: string) => void
	passedStages: Set<Stage>
	markStage: (stage: Stage) => void
	workflow: WorkflowState
	startTask: (task: string, label: string) => void
	stopTask: () => void
	setActivePrompt: (prompt: PromptConfig | null) => void
	setPromptValue: (value: string) => void
	appendPromptValue: (value: string) => void
	popPromptValue: () => void
	setFailedTask: (failedTask: FailedTask | null) => void
	setSavedRcPath: (path: string | null) => void
	setStatusNote: (note: string | null) => void
	setLastClockifyLookupApiKey: (value: string | null) => void
}

const INITIAL_CHECKS: Checks = {
	azureCliPath: null,
	azureDevopsPath: null,
	azureDevopsUsername: null,
	clockifyApiKey: null,
	clockifyUserId: null,
	clockifyWorkspaceId: null,
}

const INITIAL_CHECK_STATUS: Record<CheckKey, CheckStatus> = {
	azureCliPath: "idle",
	azureDevopsPath: "idle",
	azureDevopsUsername: "idle",
	clockifyApiKey: "idle",
	clockifyUserId: "idle",
	clockifyWorkspaceId: "idle",
}

export const useGlobalStore = create<GlobalStore>((set) => ({
	error: null,
	setError: (error) => set({ error }),
	checks: INITIAL_CHECKS,
	checkStatus: INITIAL_CHECK_STATUS,
	startCheck: (key) =>
		set((state) => ({
			checkStatus: {
				...state.checkStatus,
				[key]: "loading",
			},
		})),
	resolveCheck: (key, value) =>
		set((state) => ({
			checks: {
				...state.checks,
				[key]: value,
			},
			checkStatus: {
				...state.checkStatus,
				[key]: "resolved",
			},
		})),
	setCheck: (key, value) =>
		set((state) => ({
			checks: {
				...state.checks,
				[key]: value,
			},
		})),
	osSupported: null,
	setOsSupported: (value) => set({ osSupported: value }),
	brewPath: null,
	setBrewPath: (path) => set({ brewPath: path }),
	passedStages: new Set<Stage>(["start"]),
	markStage: (stage) =>
		set((state) => ({
			passedStages: new Set(state.passedStages).add(stage),
		})),
	workflow: {
		runningTask: null,
		runningLabel: "",
		activePrompt: null,
		promptValue: "",
		failedTask: null,
		savedRcPath: null,
		statusNote: null,
		lastClockifyLookupApiKey: null,
	},
	startTask: (task, label) =>
		set((state) => ({
			workflow: {
				...state.workflow,
				runningTask: task,
				runningLabel: label,
			},
		})),
	stopTask: () =>
		set((state) => ({
			workflow: {
				...state.workflow,
				runningTask: null,
				runningLabel: "",
			},
		})),
	setActivePrompt: (prompt) =>
		set((state) => ({
			workflow: {
				...state.workflow,
				activePrompt: prompt,
			},
		})),
	setPromptValue: (value) =>
		set((state) => ({
			workflow: {
				...state.workflow,
				promptValue: value,
			},
		})),
	appendPromptValue: (value) =>
		set((state) => ({
			workflow: {
				...state.workflow,
				promptValue: state.workflow.promptValue + value,
			},
		})),
	popPromptValue: () =>
		set((state) => ({
			workflow: {
				...state.workflow,
				promptValue: state.workflow.promptValue.slice(0, -1),
			},
		})),
	setFailedTask: (failedTask) =>
		set((state) => ({
			workflow: {
				...state.workflow,
				failedTask,
			},
		})),
	setSavedRcPath: (path) =>
		set((state) => ({
			workflow: {
				...state.workflow,
				savedRcPath: path,
			},
		})),
	setStatusNote: (note) =>
		set((state) => ({
			workflow: {
				...state.workflow,
				statusNote: note,
			},
		})),
	setLastClockifyLookupApiKey: (value) =>
		set((state) => ({
			workflow: {
				...state.workflow,
				lastClockifyLookupApiKey: value,
			},
		})),
}))
