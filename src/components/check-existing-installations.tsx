import Arrow from "@/components/primtives/arrow"
import Intendation from "@/components/primtives/indentation"
import { Br } from "@/components/primtives/line-break"
import { useGlobalStore } from "@/stores/global"
import { normalizeHomePath } from "@/utils/path"
import { $ } from "bun"
import { Text } from "ink"
import Spinner from "ink-spinner"
import { useEffect, useState } from "react"

export function ExistingInstallations() {
	const { passedStages } = useGlobalStore()

	return (
		<Text>
			<Arrow />
			<Text bold> Checking for existing installations </Text>

			{!passedStages.has("existing-azure-cli") &&
				!passedStages.has("existing-azure-devops") &&
				!passedStages.has("existing-azure-devops-org") &&
				!passedStages.has("existing-azure-devops-project") &&
				!passedStages.has("existing-azure-devops-username") &&
				!passedStages.has("existing-clockify-api-key") &&
				!passedStages.has("existing-clockify-user-id") &&
				!passedStages.has("existing-clockify-workspace-id") &&
				!passedStages.has("existing-skills") && (
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
				<CheckAzureDevOpsUsername />
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
				<CheckClockifyApiKey />
				<Br />
				<CheckClockifyUserID />
				<Br />
				<CheckClockifyWorkspaceID />
			</Intendation>
		</Text>
	)
}

function maskSecretLastFour(secret: string): string {
	const trimmed = secret.trim()
	if (trimmed.length === 0) return ""
	if (trimmed.length <= 4) return "*".repeat(trimmed.length)
	return "*".repeat(trimmed.length - 4) + trimmed.slice(-4)
}

function CheckClockifyApiKey() {
	const { passedStages, setPassedStages } = useGlobalStore()
	const [apiKey, setApiKey] = useState<string | null>(null)

	useEffect(() => {
		$`printenv CLOCKIFY_API_KEY`.text().then(raw => {
			setApiKey(raw.trim())
			setPassedStages(passedStages.add("existing-clockify-api-key"))
		})
	}, [])

	return (
		<Text>
			<Arrow varient={3} color="yellow" />
			<Text bold> CLOCKIFY_API_KEY: </Text>

			{apiKey === null ? (
				<Text color="blue">
					<Spinner />
				</Text>
			) : (
				<Text color={apiKey ? "green" : "red"}>
					{apiKey ? "*".repeat(16) + apiKey.slice(-4) : "not set"}
				</Text>
			)}
		</Text>
	)
}

function CheckClockifyUserID() {
	const { passedStages, setPassedStages } = useGlobalStore()
	const [userID, setUserID] = useState<string | null>(null)

	useEffect(() => {
		$`printenv CLOCKIFY_USER_ID`.text().then(raw => {
			setUserID(raw.trim())
			setPassedStages(passedStages.add("existing-clockify-user-id"))
		})
	}, [])

	return (
		<Text>
			<Arrow varient={3} color="yellow" />
			<Text bold> CLOCKIFY_USER_ID: </Text>

			{userID === null ? (
				<Text color="blue">
					<Spinner />
				</Text>
			) : (
				<Text color={userID ? "green" : "red"}>
					{userID || "not set"}
				</Text>
			)}
		</Text>
	)
}

function CheckClockifyWorkspaceID() {
	const { passedStages, setPassedStages } = useGlobalStore()
	const [workspaceID, setWorkspaceID] = useState<string | null>(null)

	useEffect(() => {
		$`printenv CLOCKIFY_WORKSPACE_ID`.text().then(raw => {
			setWorkspaceID(raw.trim())
			setPassedStages(passedStages.add("existing-clockify-workspace-id"))
		})
	}, [])

	return (
		<Text>
			<Arrow varient={3} color="yellow" />
			<Text bold> CLOCKIFY_WORKSPACE_ID: </Text>

			{workspaceID === null ? (
				<Text color="blue">
					<Spinner />
				</Text>
			) : (
				<Text color={workspaceID ? "green" : "red"}>
					{workspaceID || "not set"}
				</Text>
			)}
		</Text>
	)
}

function CheckAzureCli() {
	const { passedStages, setPassedStages } = useGlobalStore()
	const [azureCliPath, setAzureCliPath] = useState<string | null>(null)

	useEffect(() => {
		$`which az`.text().then(path => {
			setAzureCliPath(normalizeHomePath(path))
			setPassedStages(passedStages.add("existing-azure-cli"))
		})
	}, [])

	return (
		<Text>
			<Arrow varient={3} color="yellow" />
			<Text bold> azure-cli: </Text>

			{azureCliPath === null ? (
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
	const { passedStages, setPassedStages } = useGlobalStore()
	const [azureDevOpsPath, setAzureDevOpsPath] = useState<string | null>(null)

	useEffect(() => {
		$`az extension show --name azure-devops`.json().then(dump => {
			setAzureDevOpsPath(normalizeHomePath(dump.path))
			setPassedStages(passedStages.add("existing-azure-devops"))
		})
	}, [])

	if (!passedStages.has("existing-azure-cli")) {
		return null
	}

	return (
		<Text>
			<Arrow varient={3} color="yellow" />
			<Text bold> azure-devops: </Text>

			{azureDevOpsPath === null ? (
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

function CheckAzureDevOpsUsername() {
	const { passedStages, setPassedStages } = useGlobalStore()
	const [username, setUsername] = useState<string | null>(null)

	useEffect(() => {
		$`printenv AZURE_DEVOPS_USERNAME`.text().then(raw => {
			setUsername(raw.trim())
			setPassedStages(passedStages.add("existing-azure-devops-username"))
		})
	}, [])

	return (
		<Text>
			<Arrow varient={3} color="yellow" />
			<Text bold> AZURE_DEVOPS_USERNAME: </Text>

			{username === null ? (
				<Text color="blue">
					<Spinner />
				</Text>
			) : (
				<Text color={username ? "green" : "red"}>
					{username || "not set"}
				</Text>
			)}
		</Text>
	)
}
