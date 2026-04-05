export const STAGES = [
	"start",
	"os",
	"brew",
	"existing-skills",
	"existing-azure-cli",
	"existing-azure-devops",
	"existing-azure-devops-org",
	"existing-azure-devops-project",
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
