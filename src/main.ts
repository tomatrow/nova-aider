import { ContextTreeDataProvider, type ContextTreeNode } from "./ContextTreeDataProvider"
import { isSameSet } from "./utility"
import { watchTextDocumentPaths, getTextDocumentPaths } from "./nova-utility"
import { listGitIgnoredFiles } from "./git"
import { type AiderCoderState } from "./types"

let contextTreeDataProvider: ContextTreeDataProvider
let contextTreeView: TreeView<ContextTreeNode>
let coderCacheWatcher: FileSystemWatcher
let textDocumentPathsWatcher: ReturnType<typeof watchTextDocumentPaths>
let gitIgnoredFiles = new Set<string>()
let textDocumentPaths = getTextDocumentPaths()
let coder: AiderCoderState = {
	abs_fnames: [],
	abs_read_only_fnames: [],
	edit_format: "code"
}

async function refreshGitIgnoredFiles() {
	try {
		gitIgnoredFiles = new Set(await listGitIgnoredFiles())
		contextTreeDataProvider.update(coder, textDocumentPaths, gitIgnoredFiles)
		await contextTreeView.reload()
	} catch (error) {
		console.error(error)
	}
}

async function handleCoderChange(newCoder: AiderCoderState) {
	if (coder) {
		const isSameCoder =
			isSameSet(coder.abs_fnames, newCoder.abs_fnames) &&
			isSameSet(coder.abs_read_only_fnames, newCoder.abs_read_only_fnames) &&
			coder.edit_format === newCoder.edit_format
		if (isSameCoder) return
	}

	coder = newCoder
	contextTreeDataProvider.update(coder, getTextDocumentPaths(), gitIgnoredFiles)
	await contextTreeView.reload()
}

const CODER_STATE_FILE_PATH = ".aider.nova.cache.v1/coder.json"
const MESSAGES_FILE_PATH = ".aider.nova.cache.v1/messages.json"

function readCoderState() {
	try {
		const file = nova.fs.open(
			nova.path.join(nova.workspace.path!, CODER_STATE_FILE_PATH),
			"r",
			"utf8"
		) as FileTextMode
		const text = file.read()
		if (!text) return
		const coder: AiderCoderState = JSON.parse(text)
		return coder
	} catch (error) {
		console.error(error)
	}
}

function writeMessages(messages: string[]) {
	const file = nova.fs.open(
		nova.path.join(nova.workspace.path!, MESSAGES_FILE_PATH),
		"w",
		"utf8"
	) as FileTextMode
	file.write(JSON.stringify(messages))
	file.close()
}

function watchCoderCache(onChange?: (coder: AiderCoderState) => void) {
	return nova.fs.watch(CODER_STATE_FILE_PATH, () => {
		const coder = readCoderState()
		if (!coder) return
		onChange?.(coder)
	})
}

export async function activate() {
	console.log("[activate]")

	await refreshGitIgnoredFiles()

	contextTreeDataProvider = new ContextTreeDataProvider()
	contextTreeView = new TreeView("dev.ajcaldwell.aider.sidebar.context", {
		dataProvider: contextTreeDataProvider
	})
	coderCacheWatcher = watchCoderCache(handleCoderChange)
	textDocumentPathsWatcher = watchTextDocumentPaths(newTextDocumentPaths => {
		textDocumentPaths = newTextDocumentPaths
		contextTreeDataProvider.update(coder, textDocumentPaths, gitIgnoredFiles)
		contextTreeView.reload()
	})

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
		async message => {
			if (!message) return

			const activeTextEditor = nova.workspace.activeTextEditor
			if (activeTextEditor && !activeTextEditor.selectedRange.empty) {
				const textInSelectedLineRange = activeTextEditor.getTextInRange(
					activeTextEditor.getLineRangeForRange(activeTextEditor.selectedRange)
				)

				const snippet = `<snippet fileName="${activeTextEditor.document.path}" language="${activeTextEditor.document.syntax}">\n${textInSelectedLineRange}\n</snippet>`
				message += `the following snippet is primary context of text selected by the user:\n${snippet}`
			}

			writeMessages([message])
		}
	)
})

nova.commands.register("dev.ajcaldwell.aider.clip_aider_server_script", async () => {
	const startServerCommand = `uv run --python python3.12 --with aider-chat '${nova.path.join(nova.extension.path, "server/aider-chat-with-server.py")}'`

	await nova.clipboard.writeText(startServerCommand)

	const notification = new NotificationRequest()

	notification.title = "Copied to clipboard!"
	notification.body = "Paste server into terminal emulator"

	await nova.notifications.add(notification)
})

nova.commands.register("dev.ajcaldwell.aider.sidebar.context.double-click", () => {
	nova.commands.invoke("dev.ajcaldwell.aider.sidebar.context.open")
})

nova.commands.register("dev.ajcaldwell.aider.sidebar.context.open", () => {
	for (const node of contextTreeView.selection)
		switch (node.type) {
			case "EDITABLE_FILE":
			case "READONLY_FILE":
				nova.workspace.openFile(node.absoluteFilePath)
		}
})

nova.commands.register("dev.ajcaldwell.aider.sidebar.context.drop", () => {
	const nodesToDrop = contextTreeView.selection.filter(
		node => node.type === "EDITABLE_FILE" || node.type === "READONLY_FILE"
	)
	if (!nodesToDrop.length) return

	writeMessages([`/drop ${nodesToDrop.map(node => node.absoluteFilePath).join(" ")}`])
})

nova.commands.register("dev.ajcaldwell.aider.sidebar.context.move_to_readonly", () => {
	const nodesToRead = contextTreeView.selection.filter(
		node => node.type === "EDITABLE_FILE" || node.type === "SUGGESTED_FILE"
	)
	if (!nodesToRead.length) return

	writeMessages([`/read ${nodesToRead.map(node => node.absoluteFilePath).join(" ")}`])
})

nova.commands.register("dev.ajcaldwell.aider.sidebar.context.move_to_editable", () => {
	const nodesToAdd = contextTreeView.selection.filter(
		node => node.type === "READONLY_FILE" || node.type === "SUGGESTED_FILE"
	)
	if (!nodesToAdd.length) return

	writeMessages([`/add ${nodesToAdd.map(node => node.absoluteFilePath).join(" ")}`])
})

nova.commands.register("dev.ajcaldwell.aider.refresh-git-ignored", () => {
	refreshGitIgnoredFiles()
})
