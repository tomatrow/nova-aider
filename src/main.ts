import { AiderCoderClient } from "./AiderCoderClient"

let aiderCoderClient: AiderCoderClient

export function activate() {
	console.log("[activate]")

	aiderCoderClient = new AiderCoderClient()

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
				if (value) aiderCoderClient.run(value)
			}
		)
	})
}

export function deactivate() {
	console.log("[deactivate]")
}
