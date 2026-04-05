import { Text } from "ink"
import React from "react"

export default function Indentation({
	size = 4,
	children,
}: {
	size?: number
	children: React.ReactNode
}) {
	const indent = " ".repeat(size)

	return (
		<>
			{React.Children.map(children, child => (
				<Text>
					{indent}
					{child}
				</Text>
			))}
		</>
	)
}
