import Arrow from "@/components/primtives/arrow"
import Intendation from "@/components/primtives/indentation"
import { Br } from "@/components/primtives/line-break"
import { useGlobalStore } from "@/stores/global"
import type { CheckKey } from "@/types/checks"
import { EXISTING_INSTALLATION_STAGES, type Stage } from "@/types/stage"
import { normalizeHomePath } from "@/utils/path"
import { $ } from "bun"
import { Text } from "ink"
import Spinner from "ink-spinner"
import { useEffect } from "react"

export function ExistingInstallations() {
	const passedStages = useGlobalStore((state) => state.passedStages)
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
	checkKey: Extract<
		CheckKey,
		| "azureDevopsUsername"
		| "clockifyApiKey"
		| "clockifyUserId"
		| "clockifyWorkspaceId"
	>
	stage: Stage
	mask?: boolean
}) {
	const value = useGlobalStore((state) => state.checks[checkKey])
	const status = useGlobalStore((state) => state.checkStatus[checkKey])
	const startCheck = useGlobalStore((state) => state.startCheck)
	const resolveCheck = useGlobalStore((state) => state.resolveCheck)
	const markStage = useGlobalStore((state) => state.markStage)

	useEffect(() => {
		let cancelled = false
		startCheck(checkKey)

		$`printenv ${label}`
			.text()
			.then((raw) => {
				if (cancelled) return

				const trimmed = raw.trim()
				resolveCheck(checkKey, trimmed)
				markStage(stage)
			})
			.catch(() => {
				if (cancelled) return

				resolveCheck(checkKey, "")
				markStage(stage)
			})

		return () => {
			cancelled = true
		}
	}, [checkKey, label, markStage, resolveCheck, stage, startCheck])

	return (
		<Text>
			<Arrow varient={3} color="yellow" /> <Text bold>{label}: </Text>
			{status !== "resolved" ? (
				<Text color="blue">
					<Spinner />
				</Text>
			) : (
				<Text color={value ? "green" : "red"}>
					{value
						? mask
							? maskSecretLastFour(value)
							: value
						: "not set"}
				</Text>
			)}
		</Text>
	)
}

function CheckAzureCli() {
	const azureCliPath = useGlobalStore((state) => state.checks.azureCliPath)
	const status = useGlobalStore((state) => state.checkStatus.azureCliPath)
	const startCheck = useGlobalStore((state) => state.startCheck)
	const resolveCheck = useGlobalStore((state) => state.resolveCheck)
	const markStage = useGlobalStore((state) => state.markStage)

	useEffect(() => {
		let cancelled = false
		startCheck("azureCliPath")

		const checkAzureCli = async () => {
			try {
				const path = normalizeHomePath(
					(await $`which az`.text()).trim()
				)
				if (cancelled) return

				resolveCheck("azureCliPath", path)
				markStage("existing-azure-cli")
			} catch {
				if (cancelled) return

				resolveCheck("azureCliPath", "")
				markStage("existing-azure-cli")
			}
		}

		checkAzureCli()

		return () => {
			cancelled = true
		}
	}, [markStage, resolveCheck, startCheck])

	return (
		<Text>
			<Arrow varient={3} color="yellow" />
			<Text bold> azure-cli: </Text>
			{status !== "resolved" ? (
				<Text color="blue">
					<Spinner />
				</Text>
			) : (
				<Text color={azureCliPath ? "green" : "red"}>
					{azureCliPath || "az not found"}
				</Text>
			)}
		</Text>
	)
}

function CheckAzureDevOps() {
	const passedStages = useGlobalStore((state) => state.passedStages)
	const azureCliPath = useGlobalStore((state) => state.checks.azureCliPath)
	const azureDevOpsPath = useGlobalStore(
		(state) => state.checks.azureDevopsPath
	)
	const status = useGlobalStore((state) => state.checkStatus.azureDevopsPath)
	const startCheck = useGlobalStore((state) => state.startCheck)
	const resolveCheck = useGlobalStore((state) => state.resolveCheck)
	const markStage = useGlobalStore((state) => state.markStage)

	useEffect(() => {
		if (!passedStages.has("existing-azure-cli")) return

		let cancelled = false
		startCheck("azureDevopsPath")

		const checkAzureDevOps = async () => {
			if (!azureCliPath) {
				if (cancelled) return

				resolveCheck("azureDevopsPath", "")
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
				resolveCheck("azureDevopsPath", path)
				markStage("existing-azure-devops")
			} catch {
				if (cancelled) return

				resolveCheck("azureDevopsPath", "")
				markStage("existing-azure-devops")
			}
		}

		checkAzureDevOps()

		return () => {
			cancelled = true
		}
	}, [azureCliPath, markStage, passedStages, resolveCheck, startCheck])

	if (!passedStages.has("existing-azure-cli") || !azureCliPath) {
		return null
	}

	return (
		<Text>
			<Arrow varient={3} color="yellow" />
			<Text bold> azure-devops: </Text>
			{status !== "resolved" ? (
				<Text color="blue">
					<Spinner />
				</Text>
			) : (
				<Text color={azureDevOpsPath ? "green" : "red"}>
					{azureDevOpsPath || "devops extension missing"}
				</Text>
			)}
		</Text>
	)
}
