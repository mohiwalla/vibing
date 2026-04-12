import { existsSync } from "node:fs"
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { homedir } from "node:os"

function escapeShellValue(value: string) {
	return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')
}

export function getShellRcPath() {
	const shell = process.env.SHELL ?? ""

	if (shell.endsWith("/zsh")) return join(homedir(), ".zshrc")
	if (shell.endsWith("/bash")) return join(homedir(), ".bashrc")

	return join(homedir(), ".profile")
}

export async function upsertEnvVar(name: string, value: string) {
	const rcPath = getShellRcPath()
	const exportLine = `export ${name}="${escapeShellValue(value)}"`
	const pattern = new RegExp(`^export ${name}=.*$`, "m")

	if (!existsSync(rcPath)) {
		await mkdir(dirname(rcPath), { recursive: true })
		await writeFile(rcPath, `${exportLine}\n`)
		process.env[name] = value
		return rcPath
	}

	const current = await readFile(rcPath, "utf8")
	const next = pattern.test(current)
		? current.replace(pattern, exportLine)
		: `${current.trimEnd()}\n${exportLine}\n`

	await writeFile(rcPath, next)
	process.env[name] = value
	return rcPath
}
