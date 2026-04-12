import Arrow from "@/components/primtives/arrow"
import Intendation from "@/components/primtives/indentation"
import { Br } from "@/components/primtives/line-break"
import { useGlobalStore } from "@/stores/global"
import type { CheckKey, Checks } from "@/types/checks"
import { EXISTING_INSTALLATION_STAGES } from "@/types/stage"
import { fetchClockifyContext, getClockifyApiKeyHelp } from "@/utils/clockify"
import { upsertEnvVar } from "@/utils/env"
import { normalizeHomePath } from "@/utils/path"
import { $ } from "bun"
import { Text, useApp, useInput } from "ink"
import Spinner from "ink-spinner"
import { useEffect, useState } from "react"

type SetupFlags = {
	clockify?: boolean
	azure?: boolean
}

type PromptConfig = {
	checkKey: CheckKey
	envName: string
	label: string
	secret?: boolean
	help?: string[]
}

type FailedTask = {
	id: string
	message: string
}

const PROMPT_ORDER: PromptConfig[] = [
	{
		checkKey: "azureDevopsUsername",
		envName: "AZURE_DEVOPS_USERNAME",
		label: "Azure DevOps username",
	},
	{
		checkKey: "clockifyApiKey",
		envName: "CLOCKIFY_API_KEY",
		label: "Clockify API key",
		secret: true,
		help: getClockifyApiKeyHelp(),
	},
	{
		checkKey: "clockifyUserId",
		envName: "CLOCKIFY_USER_ID",
		label: "Clockify user ID",
	},
	{
		checkKey: "clockifyWorkspaceId",
		envName: "CLOCKIFY_WORKSPACE_ID",
		label: "Clockify workspace ID",
	},
]

export function ResolveMissingInstallations({ clockify, azure }: SetupFlags) {
	const { exit } = useApp()
	const { checks, passedStages, setCheck, markStage, setError } =
		useGlobalStore()
	const [runningTask, setRunningTask] = useState<string | null>(null)
	const [runningLabel, setRunningLabel] = useState<string>("")
	const [activePrompt, setActivePrompt] = useState<PromptConfig | null>(null)
	const [promptValue, setPromptValue] = useState("")
	const [failedTask, setFailedTask] = useState<FailedTask | null>(null)
	const [savedRcPath, setSavedRcPath] = useState<string | null>(null)
	const [statusNote, setStatusNote] = useState<string | null>(null)
	const [lastClockifyLookupApiKey, setLastClockifyLookupApiKey] = useState<
		string | null
	>(null)

	const checksComplete = EXISTING_INSTALLATION_STAGES.every((stage) =>
		passedStages.has(stage)
	)
	const handleAzure = azure || (!azure && !clockify)
	const handleClockify = clockify || (!azure && !clockify)
	const missing = getMissingRequirements(checks, handleAzure, handleClockify)
	const isDone =
		checksComplete &&
		missing.length === 0 &&
		!activePrompt &&
		!runningTask &&
		!failedTask

	useInput((input, key) => {
		if (!activePrompt) return

		if (key.return) {
			const trimmed = promptValue.trim()
			if (!trimmed) return

			void submitPrompt(activePrompt, trimmed)
			return
		}

		if (key.backspace || key.delete) {
			setPromptValue((value) => value.slice(0, -1))
			return
		}

		if (key.ctrl || key.meta || !input) return

		setPromptValue((value) => value + input)
	})

	useEffect(() => {
		if (!checksComplete || runningTask || activePrompt || failedTask) return

		const runTask = async () => {
			try {
				if (handleAzure && !checks.azureCliPath) {
					setRunningTask("install-azure-cli")
					setRunningLabel("Installing azure-cli with Homebrew")

					await $`brew install azure-cli`.quiet()
					const path = normalizeHomePath(
						(await $`which az`.text()).trim()
					)
					if (!path)
						throw new Error(
							"azure-cli install finished but `az` still missing"
						)

					setCheck("azureCliPath", path)
					markStage("azure-cli")
					setStatusNote("azure-cli installed")
					return
				}

				if (handleAzure && !checks.azureDevopsPath) {
					setRunningTask("install-azure-devops")
					setRunningLabel(
						"Installing azure-devops Azure CLI extension"
					)

					await $`az extension add --name azure-devops --yes`.quiet()
					const dump =
						(await $`az extension show --name azure-devops`.json()) as {
							path?: string
						}
					const path = normalizeHomePath(dump.path ?? "")
					if (!path) {
						throw new Error(
							"azure-devops extension install finished but extension still missing"
						)
					}

					setCheck("azureDevopsPath", path)
					markStage("azure-devops")
					setStatusNote("azure-devops extension installed")
					return
				}

				if (
					handleClockify &&
					checks.clockifyApiKey &&
					(!checks.clockifyUserId || !checks.clockifyWorkspaceId) &&
					lastClockifyLookupApiKey !== checks.clockifyApiKey
				) {
					setRunningTask("lookup-clockify-context")
					setRunningLabel(
						"Fetching Clockify user and workspace from API key"
					)

					const { userId, workspaceId } = await fetchClockifyContext(
						checks.clockifyApiKey
					)
					const nextChecks = { ...checks }

					if (userId && !checks.clockifyUserId) {
						await upsertEnvVar("CLOCKIFY_USER_ID", userId)
						setCheck("clockifyUserId", userId)
						nextChecks.clockifyUserId = userId
					}

					if (workspaceId && !checks.clockifyWorkspaceId) {
						await upsertEnvVar("CLOCKIFY_WORKSPACE_ID", workspaceId)
						setCheck("clockifyWorkspaceId", workspaceId)
						nextChecks.clockifyWorkspaceId = workspaceId
					}

					setLastClockifyLookupApiKey(checks.clockifyApiKey)
					markEnvStages(nextChecks, markStage)
					setStatusNote("Clockify IDs auto-filled from API")
					return
				}

				const nextPrompt = getNextPrompt(
					checks,
					handleAzure,
					handleClockify
				)
				if (nextPrompt) {
					setActivePrompt(nextPrompt)
					setPromptValue("")
					setStatusNote(null)
				}
			} catch (error) {
				const message =
					error instanceof Error
						? error.message
						: "Unknown setup error"
				setError(message)
				setFailedTask({
					id: runningTask ?? "setup",
					message,
				})
			} finally {
				setRunningTask(null)
				setRunningLabel("")
			}
		}

		void runTask()
	}, [
		activePrompt,
		checks,
		checksComplete,
		failedTask,
		handleAzure,
		handleClockify,
		lastClockifyLookupApiKey,
		markStage,
		runningTask,
		setCheck,
		setError,
	])

	useEffect(() => {
		if (!isDone) return

		const timeout = setTimeout(() => {
			exit()
		}, 150)

		return () => {
			clearTimeout(timeout)
		}
	}, [exit, isDone])

	async function submitPrompt(prompt: PromptConfig, value: string) {
		try {
			const rcPath = await upsertEnvVar(prompt.envName, value)
			const nextChecks = {
				...checks,
				[prompt.checkKey]: value,
			} as Checks

			setSavedRcPath(rcPath)
			setCheck(prompt.checkKey, value)
			markEnvStages(nextChecks, markStage)

			if (prompt.checkKey === "clockifyApiKey") {
				setLastClockifyLookupApiKey(null)
			}

			setActivePrompt(null)
			setPromptValue("")
			setStatusNote(`${prompt.envName} saved to ${rcPath}`)
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: `Failed saving ${prompt.envName}`
			setError(message)
			setFailedTask({
				id: prompt.envName,
				message,
			})
		}
	}

	if (!checksComplete) {
		return null
	}

	return (
		<Text>
			<Br />
			<Arrow />
			<Text bold> Resolving missing setup </Text>

			{runningTask && (
				<Text color="blue">
					<Spinner type="dots" />
				</Text>
			)}

			<Br />

			<Intendation size={4}>
				{isDone ? (
					<Text color="green">
						all required tools and envs present
					</Text>
				) : (
					<>
						<Text>
							<Text bold> missing: </Text>
							<Text color="yellow">{missing.join(", ")}</Text>
						</Text>
						<Br />

						{runningTask && (
							<>
								<Text>
									<Arrow varient={2} color="red" />{" "}
									<Text bold> action: </Text>
									{runningLabel}
								</Text>
								<Br />
							</>
						)}

						{activePrompt && (
							<>
								<Text>
									<Arrow varient={2} color="red" />{" "}
									<Text bold> need input: </Text>
									{activePrompt.label}
								</Text>
								<Br />

								{activePrompt.help?.map((line) => (
									<Text key={line}>
										<Arrow varient={3} color="yellow" />{" "}
										{line}
										<Br />
									</Text>
								))}

								<Text>
									<Arrow varient={3} color="yellow" />{" "}
									<Text bold> enter value: </Text>
									<Text color="cyan">
										{activePrompt.secret
											? "*".repeat(promptValue.length)
											: promptValue || " "}
									</Text>
								</Text>
								<Br />
								<Text color="gray">press Enter to save</Text>
								<Br />
							</>
						)}

						{statusNote && (
							<>
								<Text color="green">{statusNote}</Text>
								<Br />
							</>
						)}

						{savedRcPath && (
							<>
								<Text color="gray">
									shell rc: {savedRcPath}
								</Text>
								<Br />
							</>
						)}

						{failedTask && (
							<Text color="red">
								<Text bold> failed: </Text>
								{failedTask.id}: {failedTask.message}
							</Text>
						)}
					</>
				)}
			</Intendation>
		</Text>
	)
}

function getMissingRequirements(
	checks: Checks,
	handleAzure: boolean,
	handleClockify: boolean
) {
	const missing: string[] = []

	if (handleAzure && !checks.azureCliPath) missing.push("azure-cli")
	if (handleAzure && !checks.azureDevopsPath)
		missing.push("azure-devops extension")
	if (handleAzure && !checks.azureDevopsUsername)
		missing.push("AZURE_DEVOPS_USERNAME")
	if (handleClockify && !checks.clockifyApiKey)
		missing.push("CLOCKIFY_API_KEY")
	if (handleClockify && !checks.clockifyUserId)
		missing.push("CLOCKIFY_USER_ID")
	if (handleClockify && !checks.clockifyWorkspaceId) {
		missing.push("CLOCKIFY_WORKSPACE_ID")
	}

	return missing
}

function getNextPrompt(
	checks: Checks,
	handleAzure: boolean,
	handleClockify: boolean
) {
	for (const prompt of PROMPT_ORDER) {
		if (prompt.checkKey.startsWith("azure") && !handleAzure) continue
		if (prompt.checkKey.startsWith("clockify") && !handleClockify) continue
		if (!checks[prompt.checkKey]) return prompt
	}

	return null
}

function markEnvStages(
	checks: Checks,
	markStage: (stage: "azure-envs" | "clockify-envs") => void
) {
	if (checks.azureDevopsUsername) {
		markStage("azure-envs")
	}

	if (
		checks.clockifyApiKey &&
		checks.clockifyUserId &&
		checks.clockifyWorkspaceId
	) {
		markStage("clockify-envs")
	}
}
