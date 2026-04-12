import { ExistingInstallations } from "@/components/check-existing-installations"
import { Br } from "@/components/primtives/line-break"
import { ResolveMissingInstallations } from "@/components/resolve-missing-installations"
import { VerifyEnv } from "@/components/verify-env"
import { APP_NAME } from "@/utils/config"
import { Text } from "ink"
import BigText from "ink-big-text"
import Gradient from "ink-gradient"

type SetupFlags = {
	clockify?: boolean
	azure?: boolean
	slack?: boolean
}

export default function App({ clockify, azure, slack }: SetupFlags) {
	return (
		<Text>
			<Gradient name="rainbow">
				<BigText text={APP_NAME.toUpperCase()} />
			</Gradient>

			<VerifyEnv />
			<Br />

			<ExistingInstallations />
			<ResolveMissingInstallations clockify={clockify} azure={azure} />
		</Text>
	)
}
