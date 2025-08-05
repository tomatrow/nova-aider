import { runAsync } from "./nova-utility"

/** git ls-files --others --ignored --exclude-standard */
export async function listGitIgnoredFiles() {
	try {
		const cwd = nova.workspace.path!
		const args = ["git", "ls-files", "--others", "--ignored", "--exclude-standard"]
		const { code, stderr, stdout } = await runAsync("/usr/bin/env", { cwd, args })
		if (code !== 0)
			throw new Error(
				`command '${["/usr/bin/env", ...args].join()}' failed with code '${code}' and stderr '${stderr}'`
			)

		return stdout.split("\n").map(path => nova.path.join(cwd, path))
	} catch (error) {
		console.error(error)
	}
}
