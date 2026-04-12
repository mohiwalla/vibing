import Arrow from "@/components/primtives/arrow"
import Intendation from "@/components/primtives/indentation"
import { Br } from "@/components/primtives/line-break"
import { useGlobalStore } from "@/stores/global"
import { EXISTING_INSTALLATION_STAGES, type Stage } from "@/types/stage"
import { normalizeHomePath } from "@/utils/path"
import { $ } from "bun"
import { Text } from "ink"
import Spinner from "ink-spinner"
import { useEffect, useState } from "react"

export function ExistingInstallations() {
	const { passedStages } = useGlobalStore()
	const isComplete = EXISTING_INSTALLATION_STAGES.every((stage) =>
		passedStages.has(stage)
	)

	return (
		<Text>
			<Arrow />
			<Text bold> Checking for existing installations </Text>

			{!isComplete && (
				<Text color="blue">
					<Spinner type="binary" />
				</Text>
			)}

			<Br />

			<Intendation size={4}>
				<CheckAzure />
				<Br />
				<CheckClockify />
			</Intendation>
		</Text>
	)
}

function CheckAzure() {
	return (
		<Text>
			<Arrow varient={2} color="red" />
			<Text bold> azure: </Text>
			<Br />

			<Intendation size={8}>
				<CheckAzureCli />
				<Br />
				<CheckAzureDevOps />
				<Br />
				<CheckEnvVar
					label="AZURE_DEVOPS_USERNAME"
					checkKey="azureDevopsUsername"
					stage="existing-azure-devops-username"
				/>
			</Intendation>
		</Text>
	)
}

function CheckClockify() {
	return (
		<Text>
			<Arrow varient={2} color="red" />
			<Text bold> clockify: </Text>
			<Br />

			<Intendation size={8}>
				<CheckEnvVar
					label="CLOCKIFY_API_KEY"
					checkKey="clockifyApiKey"
					stage="existing-clockify-api-key"
					mask
				/>
				<Br />
				<CheckEnvVar
					label="CLOCKIFY_USER_ID"
					checkKey="clockifyUserId"
					stage="existing-clockify-user-id"
				/>
				<Br />
				<CheckEnvVar
					label="CLOCKIFY_WORKSPACE_ID"
					checkKey="clockifyWorkspaceId"
					stage="existing-clockify-workspace-id"
				/>
			</Intendation>
		</Text>
	)
}

function maskSecretLastFour(secret: string): string {
	const trimmed = secret.trim()
	if (!trimmed) return ""
	if (trimmed.length <= 4) return "*".repeat(trimmed.length)
	return "*".repeat(trimmed.length - 4) + trimmed.slice(-4)
}

function CheckEnvVar({
	label,
	checkKey,
	stage,
	mask = false,
}: {
	label: string
	checkKey:
		| "azureDevopsUsername"
		| "clockifyApiKey"
		| "clockifyUserId"
		| "clockifyWorkspaceId"
	stage: Stage
	mask?: boolean
}) {
	const { checks, setCheck, markStage } = useGlobalStore()
	const [value, setValue] = useState<string | null>(null)

	useEffect(() => {
		let cancelled = false

		$`printenv ${label}`
			.text()
			.then((raw) => {
				if (cancelled) return

				const trimmed = raw.trim()
				setValue(trimmed)
				setCheck(checkKey, trimmed)
				markStage(stage)
			})
			.catch(() => {
				if (cancelled) return

				setValue("")
				setCheck(checkKey, "")
				markStage(stage)
			})

		return () => {
			cancelled = true
		}
	}, [checkKey, label, markStage, setCheck, stage])

	const resolvedValue = value ?? checks[checkKey]

	return (
		<Text>
			<Arrow varient={3} color="yellow" /> <Text bold>{label}: </Text>
			{resolvedValue === null ? (
				<Text color="blue">
					<Spinner />
				</Text>
			) : (
				<Text color={resolvedValue ? "green" : "red"}>
					{resolvedValue
						? mask
							? maskSecretLastFour(resolvedValue)
							: resolvedValue
						: "not set"}
				</Text>
			)}
		</Text>
	)
}

function CheckAzureCli() {
	const { checks, setCheck, markStage } = useGlobalStore()
	const [azureCliPath, setAzureCliPath] = useState<string | null>(null)

	useEffect(() => {
		let cancelled = false

		const checkAzureCli = async () => {
			try {
				const path = normalizeHomePath(
					(await $`which az`.text()).trim()
				)
				if (cancelled) return

				setAzureCliPath(path)
				setCheck("azureCliPath", path)
				markStage("existing-azure-cli")
			} catch {
				if (cancelled) return

				setAzureCliPath("")
				setCheck("azureCliPath", "")
				markStage("existing-azure-cli")
			}
		}

		checkAzureCli()

		return () => {
			cancelled = true
		}
	}, [markStage, setCheck])

	const resolvedValue = azureCliPath ?? checks.azureCliPath

	return (
		<Text>
			<Arrow varient={3} color="yellow" />
			<Text bold> azure-cli: </Text>
			{resolvedValue === null ? (
				<Text color="blue">
					<Spinner />
				</Text>
			) : (
				<Text color={resolvedValue ? "green" : "red"}>
					{resolvedValue || "az not found"}
				</Text>
			)}
		</Text>
	)
}

function CheckAzureDevOps() {
	const { checks, passedStages, setCheck, markStage } = useGlobalStore()
	const [azureDevOpsPath, setAzureDevOpsPath] = useState<string | null>(null)
	const [shouldCheckAzureDevOps, setShouldCheckAzureDevOps] = useState<
		boolean | null
	>(null)

	useEffect(() => {
		let cancelled = false

		const checkAzureDevOps = async () => {
			try {
				const azureCliPath = (await $`which az`.text()).trim()
				if (!azureCliPath) {
					if (cancelled) return

					setShouldCheckAzureDevOps(false)
					setAzureDevOpsPath("")
					setCheck("azureDevopsPath", "")
					markStage("existing-azure-devops")
					return
				}

				if (cancelled) return
				setShouldCheckAzureDevOps(true)
			} catch {
				if (cancelled) return

				setShouldCheckAzureDevOps(false)
				setAzureDevOpsPath("")
				setCheck("azureDevopsPath", "")
				markStage("existing-azure-devops")
				return
			}

			try {
				const dump =
					(await $`az extension show --name azure-devops`.json()) as {
						path?: string
					}
				if (cancelled) return

				const path = normalizeHomePath(dump.path ?? "")
				setAzureDevOpsPath(path)
				setCheck("azureDevopsPath", path)
				markStage("existing-azure-devops")
			} catch {
				if (cancelled) return

				setAzureDevOpsPath("")
				setCheck("azureDevopsPath", "")
				markStage("existing-azure-devops")
			}
		}

		checkAzureDevOps()

		return () => {
			cancelled = true
		}
	}, [markStage, setCheck])

	if (
		!passedStages.has("existing-azure-cli") ||
		shouldCheckAzureDevOps === false
	) {
		return null
	}

	const resolvedValue = azureDevOpsPath ?? checks.azureDevopsPath

	return (
		<Text>
			<Arrow varient={3} color="yellow" />
			<Text bold> azure-devops: </Text>
			{resolvedValue === null ? (
				<Text color="blue">
					<Spinner />
				</Text>
			) : (
				<Text color={resolvedValue ? "green" : "red"}>
					{resolvedValue || "devops extension missing"}
				</Text>
			)}
		</Text>
	)
}
