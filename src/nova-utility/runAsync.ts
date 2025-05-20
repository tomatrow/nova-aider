export async function runAsync(
	executablePath: string,
	options: ConstructorParameters<typeof Process>[1]
) {
	return new Promise<{ code: number; stdout: string; stderr: string }>(resolve => {
		const process = new Process(executablePath, options)

		let stdout = ""
		let stderr = ""

		process.onStdout(line => (stdout += line))
		process.onStderr(line => (stderr += line))
		process.onDidExit(code => resolve({ code, stdout, stderr }))

		process.start()
	})
}
