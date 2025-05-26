import { AiderCoderClient, type AiderCoderState } from "./AiderCoderClient"
import { ContextTreeDataProvider, type ContextTreeNode } from "./ContextTreeDataProvider"
import { isSameSet } from "./utility"
import { wrappedNodeFetch, watchTextDocumentPaths } from "./nova-utility"
import { listGitIgnoredFiles } from "./git"

let aiderCoderClient: AiderCoderClient
let contextTreeDataProvider: ContextTreeDataProvider
let contextTreeView: TreeView<ContextTreeNode>
let textDocumentPathsWatcher: ReturnType<typeof watchTextDocumentPaths>
let coderCacheWatcher: FileSystemWatcher

let coder: AiderCoderState | undefined
async function handleCoderChange(newCoder: AiderCoderState) {
	if (coder) {
		const isSameCoder =
			isSameSet(coder.abs_fnames, newCoder.abs_fnames) &&
			isSameSet(coder.abs_read_only_fnames, newCoder.abs_read_only_fnames)
		if (isSameCoder) return
	}

	coder = newCoder
	contextTreeDataProvider.update(coder)
	await contextTreeView.reload()
}

function watchCoderCache(onChange?: (coder: AiderCoderState) => void) {
	return nova.fs.watch(".aider.nova.cache.v1/coder.json", path => {
		try {
			const file = nova.fs.open(path, "r", "utf8") as FileTextMode
			const text = file.read()
			if (!text) return
			const coder: AiderCoderState = JSON.parse(text)
			onChange?.(coder)
		} catch (error) {
			console.error(error)
		}
	})
}

export function activate() {
	console.log("[activate]")

	contextTreeDataProvider = new ContextTreeDataProvider()
	aiderCoderClient = new AiderCoderClient({
		fetch: wrappedNodeFetch as typeof fetch
	})
	contextTreeView = new TreeView("dev.ajcaldwell.aider.sidebar.context", {
		dataProvider: contextTreeDataProvider
	})
	coderCacheWatcher = watchCoderCache(handleCoderChange)
	textDocumentPathsWatcher = watchTextDocumentPaths()

	nova.subscriptions.add(contextTreeView)
	nova.subscriptions.add(coderCacheWatcher)
	nova.subscriptions.add(textDocumentPathsWatcher)
}

export function deactivate() {
	console.log("[deactivate]")
}

nova.commands.register("dev.ajcaldwell.aider.run_command", () => {
	nova.workspace.showInputPanel(
		"Run Aider Command",
		{
			label: "Command",
			placeholder: "Aider command",
			value: "",
			prompt: "Run",
			secure: false
		},
		async value => {
			if (!value) return

			const { coder } = (await aiderCoderClient.run([value])) ?? {}
			if (coder) handleCoderChange(coder)
		}
	)
})

nova.commands.register("dev.ajcaldwell.aider.sync_tabs_to_context", async () => {
	const refreshResult = await aiderCoderClient.refresh()
	if (!refreshResult?.coder) return

	const gitIgnoredFilesSet = new Set((await listGitIgnoredFiles()) ?? [])

	const tabPaths = textDocumentPathsWatcher.paths.allTextDocumentPaths
	const contextPaths = [
		...(refreshResult.coder.abs_fnames ?? []),
		...(refreshResult.coder.abs_read_only_fnames ?? [])
	]

	const messages: string[] = []

	const pathsToDrop = contextPaths.filter(contextPath => !tabPaths.includes(contextPath))
	if (pathsToDrop.length) messages.push(["/drop", ...pathsToDrop].join(" "))

	const pathsToRead = tabPaths
		.filter(tabPath => !contextPaths.includes(tabPath))
		.filter(tabPath => !gitIgnoredFilesSet.has(tabPath))
	if (pathsToRead.length) messages.push(["/read", ...pathsToRead].join(" "))

	if (!messages.length) return

	const runResult = await aiderCoderClient.run(messages)
	if (!runResult?.coder) return

	handleCoderChange(runResult.coder)
})
