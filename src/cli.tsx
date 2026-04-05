#!/usr/bin/env node

import meow from "meow"
import { render } from "ink"

import App from "@/app"
import chalk from "chalk"

const cli = meow(
	`
	Usage
	  $ bun create vibing

	Options
		--clockify, -c  Setup Clockify
		--azure, -a     Setup Azure DevOps

	Examples
	  $ bun create vibing --azure
	  Setup Azure DevOps and ask whether Clockify should also be configured

	  $ npm init vibing -- --clockify
	  Setup Clockify and ask whether Azure DevOps should also be configured
`,
	{
		importMeta: import.meta,
		flags: {
			clockify: {
				type: "boolean",
				shortFlag: "c",
			},
			azure: {
				type: "boolean",
				shortFlag: "a",
			},
		},
	}
)

render(<App {...cli.flags} />)
