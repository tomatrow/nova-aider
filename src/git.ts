import { runAsync } from "./nova-utility"

// git ls-files --others --ignored --exclude-standard
export async function listGitIgnoredFiles() {
	try {
		const runResult = await runAsync("/opt/homebrew/bin/git", {
			cwd: nova.workspace.path!,
			args: ["ls-files", "--others", "--ignored", "--exclude-standard"]
		})

		if (runResult.stderr) {
			console.error(runResult.stderr)
			return
		}

		return runResult.stdout.split("\n").map(path => nova.path.join(nova.workspace.path!, path))
	} catch (error) {
		console.error(error)
	}
}
