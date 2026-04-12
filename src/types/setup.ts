import type { CheckKey } from "@/types/checks"

export type CheckStatus = "idle" | "loading" | "resolved"

export type PromptConfig = {
	checkKey: CheckKey
	envName: string
	label: string
	secret?: boolean
	help?: string[]
}

export type FailedTask = {
	id: string
	message: string
}
