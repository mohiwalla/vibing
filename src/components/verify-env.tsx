import Arrow from "@/components/primtives/arrow"
import Intendation from "@/components/primtives/indentation"
import { Br } from "@/components/primtives/line-break"
import { useGlobalStore } from "@/stores/global"
import { checkSupportedOS } from "@/utils/common"
import { OS } from "@/utils/config"
import { $ } from "bun"
import { Text } from "ink"
import Spinner from "ink-spinner"
import { useEffect } from "react"

export function VerifyEnv() {
	const passedStages = useGlobalStore((state) => state.passedStages)

	return (
		<Text>
			<Arrow />
			<Text bold> Verifying environment </Text>

			{(!passedStages.has("os") || !passedStages.has("brew")) && (
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
	const isSupportedOS = useGlobalStore((state) => state.osSupported)
	const setOsSupported = useGlobalStore((state) => state.setOsSupported)
	const markStage = useGlobalStore((state) => state.markStage)

	useEffect(() => {
		const isSupported = checkSupportedOS()
		setOsSupported(isSupported)

		if (!isSupported) {
			process.exit(1)
		}

		markStage("os")
	}, [markStage, setOsSupported])

	return (
		<Text>
			<Arrow varient={2} color="red" />
			<Text bold> OS: </Text>

			{isSupportedOS === null ? (
				<Text color="blue">
					<Spinner />
				</Text>
			) : (
				<Text color={isSupportedOS ? "green" : "red"}>
					{isSupportedOS ? OS : `NOT supported on ${OS} ☹️`}
				</Text>
			)}
		</Text>
	)
}

function VerifyBrew() {
	const passedStages = useGlobalStore((state) => state.passedStages)
	const homebrewPath = useGlobalStore((state) => state.brewPath)
	const setBrewPath = useGlobalStore((state) => state.setBrewPath)
	const markStage = useGlobalStore((state) => state.markStage)

	useEffect(() => {
		let cancelled = false

		const verifyBrew = async () => {
			try {
				const path = (await $`which brew`.text()).trim()
				if (cancelled) return

				setBrewPath(path)

				if (!path) {
					process.exit(1)
				}

				markStage("brew")
			} catch {
				if (cancelled) return

				setBrewPath("")
				process.exit(1)
			}
		}

		verifyBrew()

		return () => {
			cancelled = true
		}
	}, [markStage, setBrewPath])

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
