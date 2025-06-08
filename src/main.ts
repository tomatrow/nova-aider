import { ContextTreeDataProvider, type ContextTreeNode } from "./ContextTreeDataProvider"
import { isSameSet } from "./utility"
import { getTextDocumentPaths } from "./nova-utility"
import { listGitIgnoredFiles } from "./git"
import { type AiderCoderState } from "./types"

let contextTreeDataProvider: ContextTreeDataProvider
let contextTreeView: TreeView<ContextTreeNode>
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

export function activate() {
	console.log("[activate]")

	contextTreeDataProvider = new ContextTreeDataProvider()
	contextTreeView = new TreeView("dev.ajcaldwell.aider.sidebar.context", {
		dataProvider: contextTreeDataProvider
	})
	coderCacheWatcher = watchCoderCache(handleCoderChange)

	nova.subscriptions.add(contextTreeView)
	nova.subscriptions.add(coderCacheWatcher)
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

nova.commands.register("dev.ajcaldwell.aider.sync_tabs_to_context", async () => {
	const coder = readCoderState() ?? {
		abs_fnames: [],
		abs_read_only_fnames: [],
		edit_format: "code"
	}

	const tabPaths = new Set(getTextDocumentPaths().allTextDocumentPaths)
	const editableContextPaths = new Set(coder.abs_fnames ?? [])

	const tabPathsOutsideWorkspace = new Set(
		[...tabPaths].filter(tabPath => !tabPath.startsWith(nova.workspace.path!))
	)
	const pathsToIgnore = new Set([
		...((await listGitIgnoredFiles()) ?? []),
		...coder.abs_read_only_fnames,
		...tabPathsOutsideWorkspace
	])

	const messages: string[] = []

	const pathsToDrop = editableContextPaths.difference(tabPaths).difference(pathsToIgnore)
	if (pathsToDrop.size) messages.push(["/drop", ...pathsToDrop].join(" "))

	const pathsToAdd = tabPaths.difference(editableContextPaths).difference(pathsToIgnore)
	if (pathsToAdd.size) messages.push(["/add", ...pathsToAdd].join(" "))

	if (!messages.length) return

	writeMessages(messages)
})

nova.commands.register("dev.ajcaldwell.aider.clip_aider_server_script", async () => {
	const startServerCommand = `uv run --python python3.12 --with aider-chat '${nova.path.join(nova.extension.path, "server/aider-chat-with-server.py")}'`

	await nova.clipboard.writeText(startServerCommand)

	const notification = new NotificationRequest()

	notification.title = "Copied to clipboard!"
	notification.body = "Paste server into terminal emulator"

	await nova.notifications.add(notification)
})
