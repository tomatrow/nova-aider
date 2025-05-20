import { AiderCoderClient } from "./AiderCoderClient"
import { ContextTreeDataProvider } from "./ContextTreeDataProvider"
import { wrappedNodeFetch } from "./nova-utility"

let aiderCoderClient: AiderCoderClient
let contextTreeDataProvider: ContextTreeDataProvider

export function activate() {
	console.log("[activate]")

	contextTreeDataProvider = new ContextTreeDataProvider()
	aiderCoderClient = new AiderCoderClient({
		fetch: wrappedNodeFetch as typeof fetch
	})

	const contextTreeView = new TreeView("dev.ajcaldwell.aider.sidebar.context", {
		dataProvider: contextTreeDataProvider
	})

	aiderCoderClient.onChange = async coder => {
		contextTreeDataProvider.update(coder)
		await contextTreeView.reload()
	}

	nova.subscriptions.add(contextTreeView)
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
