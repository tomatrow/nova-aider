/**
 * @param executablePath
 * @param options
 * @param  [stdin] - Optional text to write to stdin
 * @returns process result
 */
export async function runAsync(
	executablePath: string,
	options: ConstructorParameters<typeof Process>[1],
	stdin?: string
) {
	return new Promise<{ code: number; stdout: string; stderr: string }>(resolve => {
		const process = new Process(executablePath, options)

		let stdout = ""
		let stderr = ""

		process.onStdout(line => (stdout += line))
		process.onStderr(line => (stderr += line))
		process.onDidExit(code => resolve({ code, stdout, stderr }))

		process.start()

		const writer = stdin && process.stdin?.getWriter()
		if (!writer) return

		writer.write(stdin)
		writer.close()
	})
}
