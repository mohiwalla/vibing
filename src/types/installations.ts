export const INSTALLATIONS = [
	"skills",
	"skills-mirros",
	"azure-cli",
	"azure-devops",
	"azure-envs",
	"clockify-envs",
] as const

export type Installation = (typeof INSTALLATIONS)[number]
