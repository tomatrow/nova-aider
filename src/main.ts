import { AiderCoderClient, type AiderCoderState } from "./AiderCoderClient"
import { ContextTreeDataProvider, type ContextTreeNode } from "./ContextTreeDataProvider"
import { wrappedNodeFetch } from "./nova-utility"

let aiderCoderClient: AiderCoderClient
let contextTreeDataProvider: ContextTreeDataProvider
let contextTreeView: TreeView<ContextTreeNode>

async function sync(coder?: AiderCoderState) {
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
		fetch: wrappedNodeFetch as typeof fetch,
		onChange: sync
	})
	contextTreeView = new TreeView("dev.ajcaldwell.aider.sidebar.context", {
		dataProvider: contextTreeDataProvider
	})
	const watcher = watchCoderCache(sync)

	nova.subscriptions.add(contextTreeView)
	nova.subscriptions.add(watcher)
}

nova.commands.register("dev.ajcaldwell.aider.run", () => {
	nova.workspace.showInputPanel(
		"Run a command in aider",
		{
			label: "Command",
			placeholder: "Run any Aider command",
			value: "",
			prompt: "Run",
			secure: false
		},
		value => {
			if (!value) return

			aiderCoderClient.run(value)
		}
	)
})

export function deactivate() {
	console.log("[deactivate]")
}
