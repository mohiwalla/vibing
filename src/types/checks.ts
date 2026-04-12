export const CHECK_KEYS = [
	"azureCliPath",
	"azureDevopsPath",
	"azureDevopsUsername",
	"clockifyApiKey",
	"clockifyUserId",
	"clockifyWorkspaceId",
] as const

export type CheckKey = (typeof CHECK_KEYS)[number]

export type Checks = Record<CheckKey, string | null>
