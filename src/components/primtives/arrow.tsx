import { Text } from "ink"
import { type ForegroundColorName } from "chalk"

export default function Arrow({
	color = "blue",
	varient = 1,
}: {
	color?: ForegroundColorName
	varient?: 1 | 2 | 3 | 4
}) {
	const glyphs = {
		1: "❯",
		2: "▶",
		3: "→",
		4: ">",
	}

	return (
		<Text color={color}>
			<Text>{glyphs[varient]}</Text>
		</Text>
	)
}
