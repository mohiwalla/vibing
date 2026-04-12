export const STAGES = [
	"start",
	"os",
	"brew",
	"existing-azure-cli",
	"existing-azure-devops",
	"existing-azure-devops-username",
	"existing-clockify-api-key",
	"existing-clockify-user-id",
	"existing-clockify-workspace-id",
	"azure-cli",
	"azure-devops",
	"azure-envs",
	"clockify-envs",
	"skills",
	"skills-mirros",
] as const

export type Stage = (typeof STAGES)[number]

export const EXISTING_INSTALLATION_STAGES = [
	"existing-azure-cli",
	"existing-azure-devops",
	"existing-azure-devops-username",
	"existing-clockify-api-key",
	"existing-clockify-user-id",
	"existing-clockify-workspace-id",
] as const satisfies readonly Stage[]
