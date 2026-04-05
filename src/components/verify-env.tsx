import Arrow from "@/components/primtives/arrow"
import Intendation from "@/components/primtives/indentation"
import { Br } from "@/components/primtives/line-break"
import { useGlobalStore } from "@/stores/global"
import { checkSupportedOS } from "@/utils/common"
import { OS } from "@/utils/config"
import { $ } from "bun"
import { Text } from "ink"
import Spinner from "ink-spinner"
import { useEffect, useState } from "react"

export function VerifyEnv() {
	const { passedStages } = useGlobalStore()

	return (
		<Text>
			<Arrow />
			<Text bold> Verifying environment </Text>

			{!passedStages.has("os") && !passedStages.has("brew") && (
				<Text color="blue">
					<Spinner type="weather" />
				</Text>
			)}

			<Br />

			<Intendation size={4}>
				<VerifyOS />
				<Br />
				<VerifyBrew />
			</Intendation>
		</Text>
	)
}

function VerifyOS() {
	const { passedStages, setPassedStages } = useGlobalStore()
	const [isSupportedOS, setIsSupportedOS] = useState(false)

	useEffect(() => {
		const isSupported = checkSupportedOS()
		setIsSupportedOS(isSupported)

		if (!isSupported) {
			process.exit(1)
		}

		setPassedStages(passedStages.add("os"))
	}, [])

	return (
		<Text>
			<Arrow varient={2} color="red" />
			<Text bold> OS: </Text>

			<Text color={isSupportedOS ? "green" : "red"}>
				{isSupportedOS ? OS : `NOT supported on ${OS} ☹️`}
			</Text>
		</Text>
	)
}

function VerifyBrew() {
	const { passedStages, setPassedStages } = useGlobalStore()
	const [homebrewPath, setHomebrewPath] = useState<string | null>(null)

	useEffect(() => {
		$`which brew`.text().then(path => {
			setHomebrewPath(path)

			if (!path) {
				process.exit(1)
			}

			setPassedStages(passedStages.add("brew"))
		})
	}, [])

	if (!passedStages.has("os")) {
		return null
	}

	return (
		<Text>
			<Arrow varient={2} color="red" />
			<Text bold> homebrew: </Text>

			{homebrewPath === null ? (
				<Text color="blue">
					<Spinner />
				</Text>
			) : (
				<Text color={homebrewPath ? "green" : "red"}>
					{homebrewPath || "brew not found"}
				</Text>
			)}
		</Text>
	)
}
