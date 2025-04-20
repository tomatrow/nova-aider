class LinesProvider implements TreeDataProvider<string> {
	static lines: string[] = [
		"[AiderChatSrvice.start] stdout line I'm unable to determine the type of project without any specific details or context about the code or files involved. If you can provide some information about the structure, key files, or snippets of code, I can help identify the type of project or its purpose.",
		"[AiderChatSrvice.start] stdout line Tokens: 84 sent, 52 received. Cost: $0.00073 message, $0.00073 session."
	]

	constructor() {}

	getChildren() {
		return LinesProvider.lines
	}

	getTreeItem(line: string) {
		console.log("getTreeItem called for path:", line)
		// let name = nova.path.basename(path)
		let item = new TreeItem(line, TreeItemCollapsibleState.None)
		// item.path = path
		// item.command = "com.gingerbeardman.Bookmark.open"
		// item.contextValue = "bookmark"
		item.tooltip = line
		item.descriptiveText = line

		console.log("Created TreeItem:", item)
		return item
	}

	static addLine(line: string) {
		this.lines.push(line)
		this.saveLines()
	}

	// static removeBookmark(path) {
	// 	console.log("Removing bookmark with path:", path)
	// 	const index = this.bookmarks.indexOf(path)
	// 	if (index > -1) {
	// 		this.bookmarks.splice(index, 1)
	// 		this.saveBookmarks()
	// 		console.log("Bookmark removed and saved")
	// 	} else {
	// 		console.log("No bookmark found with path:", path)
	// 	}
	// 	console.log("Bookmarks after removal:", this.bookmarks)
	// }

	static saveLines() {
		console.log("Saving bookmarks:", this.lines)
		nova.workspace.config.set(
			"com.gingerbeardman.Bookmark.bookmarks",
			JSON.stringify(this.lines)
		)
	}

	// static loadBookmarks() {
	// 	const savedBookmarks = nova.workspace.config.get("com.gingerbeardman.Bookmark.bookmarks")
	// 	if (savedBookmarks) {
	// 		this.bookmarks = JSON.parse(savedBookmarks)
	// 		console.log("Loaded bookmarks:", this.bookmarks)
	// 	} else {
	// 		console.log("No saved bookmarks found")
	// 	}
	// }
}

const NOVA_AIDER_POLKA_PORT = 3000
// let aiderChatService: AiderChatService | undefined

export function activate() {
	console.log("[activate]")

	// 	// Create a new TreeView for bookmarks
	// 	let linesView = new TreeView("dev.ajcaldwell.aider.sidebar.chat", {
	// 		dataProvider: new LinesProvider()
	// 	})
	//
	// 	aiderChatService = new AiderChatService()
	// 	console.log({ AiderChatService })
	// 	aiderChatService.start()
	//
	// 	nova.commands.register("dev.ajcaldwell.aider.ask_mode", () => {
	// 		console.log("dev.ajcaldwell.aider.ask_mode")
	//
	// 		const options: {
	// 			generateCodeSnippet?: ChatReferenceSnippetItem
	// 			chatReferenceList?: ChatReferenceItemWithReadOnly[]
	// 		} = {}
	// 		const inputMessage = "What kind of project is this?"
	// 		const message = formatCurrentChatMessage(inputMessage, options)
	//
	// 		const payload: ServerChatPayload = {
	// 			chat_type: "ask",
	// 			diff_format: DiffFormats.Diff,
	// 			message,
	// 			reference_list: []
	// 		}
	//
	// 		aiderChatService!.apiChat(payload, () => {})
	// 	})
	nova.commands.register("dev.ajcaldwell.aider.architect_mode", () => {
		console.log("dev.ajcaldwell.aider.architect_mode")
		// aiderChatService?.apiChat("/architect", () => {})
		fetch(`http://localhost:${NOVA_AIDER_POLKA_PORT}/modes/architect`, {
			method: "POST"
		})
			.then(() => console.log("ran"))
			.catch(() => console.log("failed"))
	})
	// 	nova.commands.register("dev.ajcaldwell.aider.edit_mode", () => {
	// 		console.log("dev.ajcaldwell.aider.edit_mode")
	// 		// aiderChatService?.apiChat("/edit", () => {})
	// 	})
	// 	nova.commands.register("dev.ajcaldwell.aider.add_file_context", () => {})
	// 	nova.commands.register("dev.ajcaldwell.aider.add_web_context", () => {})
	// 	nova.commands.register("dev.ajcaldwell.aider.add_snippet_context", () => {})

	nova.commands.register("dev.ajcaldwell.aider.chat", () => {
		console.log("dev.ajcaldwell.aider.chat")
		// aiderChatService = new AiderChatService()
		// console.log({ AiderChatService })
		// aiderChatService.start()
	})
}

export function deactivate() {
	console.log("[deactivate]")

	// aiderChatService?.stop()
}

nova.assistants.registerTaskAssistant(
	{
		provideTasks() {
			const chatTask = new Task("chat")
			// let chatCommandAction = new TaskCommandAction("dev.ajcaldwell.aider.chat")
			// chatTask.setAction(Task.Run, chatCommandAction)

			const args = [nova.path.normalize(nova.path.join(__dirname, "polka.js"))]
			const command = "/Users/ajcaldwell/.local/share/nvm/v23.8.0/bin/node"
			console.log("running polka command", [command, ...args].join(" "))
			const chatProcessAction = new TaskProcessAction(command, {
				args,
				shell: "/opt/homebrew/bin/fish",
				env: { NOVA_AIDER_POLKA_PORT: NOVA_AIDER_POLKA_PORT.toString() }
			})

			chatTask.setAction(Task.Run, chatProcessAction)

			return [chatTask]
		}
	},
	{
		identifier: "dev.ajcaldwell.aider.assistant",
		name: "Aider"
	}
)
