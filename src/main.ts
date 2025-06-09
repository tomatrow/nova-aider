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

nova.commands.register("dev.ajcaldwell.aider.chat_with_selection", () => {
	const { activeTextEditor } = nova.workspace
	if (!activeTextEditor) return

	const { document, selectedRange } = activeTextEditor
	const { path, syntax } = document

	const guard = path && !selectedRange.empty
	if (!guard) return

	const selectedLineRange = activeTextEditor.getLineRangeForRange(selectedRange)
	const textInSelectedLineRange = activeTextEditor.getTextInRange(selectedLineRange)
	const snippet = `<snippet fileName="${path}" language="${syntax}" lineRange="${selectedLineRange.start}-${selectedLineRange.end}">\n${textInSelectedLineRange}\n</snippet>`

	nova.workspace.showInputPanel(
		`Chat with ${nova.path.basename(
			path
		)} (${selectedLineRange.start} - ${selectedLineRange.end})`,
		{
			label: "Command",
			placeholder: "Aider command",
			value: "",
			prompt: "Run",
			secure: false
		},
		input => {
			if (typeof input !== "string") return

			const messages: string[] = []

			if (![...coder.abs_fnames, coder.abs_read_only_fnames].includes(path))
				messages.push(`/add ${path}`)

			messages.push(`${input ?? ""}\n${snippet}`)

			writeMessages(messages)
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

nova.commands.register("dev.ajcaldwell.aider.add_snippet_to_context", () => {
	console.log("[dev.ajcaldwell.aider.add_snippet_to_context]")

	const activeTextEditor = nova.workspace.activeTextEditor
	if (!activeTextEditor) return

	const selectedLineRange = activeTextEditor.getLineRangeForRange(activeTextEditor.selectedRange)
	const textInSelectedLineRange = activeTextEditor.getTextInRange(selectedLineRange)

	console.log(
		"[dev.ajcaldwell.aider.add_snippet_to_context]",
		JSON.stringify({
			path: activeTextEditor.document.path,
			start: selectedLineRange.start,
			end: selectedLineRange.end,
			textInSelectedLineRange
		})
	)
})
