export function normalizeHomePath(path: string) {
	const normalizedPath = path?.trim().startsWith(process.env.HOME || "")
		? path.trim().replace(process.env.HOME as string, "~")
		: path

	return normalizedPath
}
