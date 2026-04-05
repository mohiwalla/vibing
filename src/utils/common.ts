export function checkSupportedOS() {
	const os = process.platform
	const supportedOS = ["darwin", "linux"]

	return supportedOS.includes(os)
}
