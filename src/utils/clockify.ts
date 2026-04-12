type ClockifyUserResponse = {
	id?: string
	activeWorkspace?: string
	defaultWorkspace?: string
	memberships?: Array<{
		workspaceId?: string
	}>
}

export function getClockifyApiKeyHelp() {
	return [
		"Open https://app.clockify.me/user/settings.",
		"Copy API key from API section.",
		"Paste key here. User/workspace auto-fill if API works.",
	]
}

export async function fetchClockifyContext(apiKey: string) {
	const response = await fetch("https://api.clockify.me/api/v1/user", {
		headers: {
			"X-Api-Key": apiKey,
			Accept: "application/json",
		},
	})

	if (!response.ok) {
		throw new Error(`Clockify API returned ${response.status}`)
	}

	const user = (await response.json()) as ClockifyUserResponse
	const workspaceId =
		user.activeWorkspace ??
		user.defaultWorkspace ??
		user.memberships?.[0]?.workspaceId ??
		""

	return {
		userId: user.id ?? "",
		workspaceId,
	}
}
