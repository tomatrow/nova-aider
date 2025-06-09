import {
	ContextTreeDataProvider,
	type ContextTreeNode,
	type ContextTreeNodeData
} from "./ContextTreeDataProvider"
import { isSameSet, isTruthy } from "./utility"
import { watchTextDocumentPaths, getTextDocumentPaths } from "./nova-utility"
import { listGitIgnoredFiles } from "./git"
import { type AiderCoderState } from "./types"

const CODER_STATE_FILE_PATH = ".aider.nova.cache.v1/coder.json"
const MESSAGES_FILE_PATH = ".aider.nova.cache.v1/messages.json"

let contextTreeDataProvider: ContextTreeDataProvider
let contextTreeView: TreeView<ContextTreeNode>
let coderCacheWatcher: FileSystemWatcher
let textDocumentPathsWatcher: ReturnType<typeof watchTextDocumentPaths>
let gitIgnoredFiles = new Set<string>()
let textDocumentPaths = getTextDocumentPaths()
let coder: AiderCoderState = {
	abs_fnames: [],
	abs_read_only_fnames: []
}
let novaSnippets: (ContextTreeNodeData & { type: "SNIPPET" })[] = []

function getSelectedSnippet() {
	const activeTextEditor = nova.workspace.activeTextEditor
	if (!activeTextEditor) return

	const { selectedText, selectedRange } = activeTextEditor
	const { path, eol, syntax } = activeTextEditor.document
	const guard = path && selectedText
	if (!guard) return

	const selectedLineRange = activeTextEditor.getLineRangeForRange(selectedRange)
	const beginLine = activeTextEditor.document
		.getTextInRange(new Range(0, selectedLineRange.start))
		.split(eol).length
	const endLine =
		activeTextEditor.document.getTextInRange(new Range(0, selectedLineRange.end)).split(eol)
			.length - 1

	const snippet = {
		type: "SNIPPET",
		absoluteFilePath: path,
		text: selectedText,
		characterRange: [selectedRange.start, selectedRange.end],
		lineRange: [beginLine, endLine],
		syntax: syntax ?? undefined
	} satisfies ContextTreeNodeData & { type: "SNIPPET" }

	return snippet
}

function snippetToContextText(snippet: ContextTreeNodeData & { type: "SNIPPET" }) {
	return `<snippet fileName="${snippet.absoluteFilePath}" language="${snippet.syntax}" lineRange="${snippet.lineRange[0]}-${snippet.lineRange[1]}">\n${snippet.text}\n</snippet>`
}

async function refreshGitIgnoredFiles() {
	try {
		gitIgnoredFiles = new Set(await listGitIgnoredFiles())
		contextTreeDataProvider.update(coder, textDocumentPaths, gitIgnoredFiles, novaSnippets)
		await contextTreeView.reload()
	} catch (error) {
		console.error(error)
	}
}

async function handleCoderChange(newCoder: AiderCoderState) {
	if (coder) {
		const isSameCoder =
			isSameSet(coder.abs_fnames, newCoder.abs_fnames) &&
			isSameSet(coder.abs_read_only_fnames, newCoder.abs_read_only_fnames)
		if (isSameCoder) return
	}

	coder = newCoder
	contextTreeDataProvider.update(coder, getTextDocumentPaths(), gitIgnoredFiles, novaSnippets)
	await contextTreeView.reload()
}

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
		contextTreeDataProvider.update(coder, textDocumentPaths, gitIgnoredFiles, novaSnippets)
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
	const selectedSnippet = getSelectedSnippet()
	if (!selectedSnippet) return

	nova.workspace.showInputPanel(
		`Chat with ${nova.path.basename(
			selectedSnippet.absoluteFilePath
		)} (${selectedSnippet.lineRange[0]} - ${selectedSnippet.lineRange[1]})`,
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

			if (
				![...coder.abs_fnames, ...coder.abs_read_only_fnames].includes(
					selectedSnippet.absoluteFilePath
				)
			)
				messages.push(`/add ${selectedSnippet.absoluteFilePath}`)

			let mainMessage = `${input ?? ""}\nSelected Snippet: ${snippetToContextText(selectedSnippet)}`

			if (novaSnippets.length)
				mainMessage += `\nThe following snippets are also available:\n${novaSnippets.map(snippetToContextText).join("\n")}`

			messages.push(mainMessage)

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

nova.commands.register("dev.ajcaldwell.aider.sidebar.context.open", async () => {
	for (const node of contextTreeView.selection)
		switch (node.type) {
			case "FILE":
				nova.workspace.openFile(node.absoluteFilePath)
				break
			case "SNIPPET": {
				const textEditorPromise = nova.workspace.openFile(node.absoluteFilePath, {
					line: node.lineRange[0]
				})

				if (contextTreeView.selection.length !== 1) break
				const textEditor = await textEditorPromise
				if (!textEditor) break

				textEditor.addSelectionForRange(new Range(...node.characterRange))

				break
			}
		}
})

nova.commands.register("dev.ajcaldwell.aider.sidebar.context.drop", () => {
	const snippetsToDrop = contextTreeView.selection.filter(node => node.type === "SNIPPET")
	if (snippetsToDrop.length) {
		novaSnippets = novaSnippets.filter(
			novaSnippet =>
				!snippetsToDrop.some(
					snippet =>
						snippet.absoluteFilePath === novaSnippet.absoluteFilePath &&
						snippet.text === novaSnippet.text &&
						snippet.characterRange[0] === novaSnippet.characterRange[0] &&
						snippet.characterRange[1] === novaSnippet.characterRange[1]
				)
		)

		contextTreeDataProvider.update(coder, textDocumentPaths, gitIgnoredFiles, novaSnippets)
		contextTreeView.reload()
	}

	const pathsToDrop = contextTreeView.selection
		.map(
			node =>
				node.type === "FILE" &&
				(node.category === "EDITABLE" || node.category === "READONLY") &&
				node.absoluteFilePath
		)
		.filter(isTruthy)
	if (pathsToDrop.length) writeMessages([`/drop ${pathsToDrop.join(" ")}`])
})

nova.commands.register("dev.ajcaldwell.aider.sidebar.context.move_to_readonly", () => {
	const pathsToRead = contextTreeView.selection
		.map(
			node =>
				node.type === "FILE" &&
				(node.category === "EDITABLE" || node.category === "SUGGESTED") &&
				node.absoluteFilePath
		)
		.filter(isTruthy)
	if (!pathsToRead.length) return

	writeMessages([`/read ${pathsToRead.join(" ")}`])
})

nova.commands.register("dev.ajcaldwell.aider.sidebar.context.move_to_editable", () => {
	const pathsToAdd = contextTreeView.selection
		.map(
			node =>
				node.type === "FILE" &&
				(node.category === "READONLY" || node.category === "SUGGESTED") &&
				node.absoluteFilePath
		)
		.filter(isTruthy)
	if (!pathsToAdd.length) return

	writeMessages([`/add ${pathsToAdd.join(" ")}`])
})

nova.commands.register("dev.ajcaldwell.aider.refresh-git-ignored", () => {
	refreshGitIgnoredFiles()
})

nova.commands.register("dev.ajcaldwell.aider.add_snippet_to_context", () => {
	const snippet = getSelectedSnippet()
	if (!snippet) return

	novaSnippets.push(snippet)

	contextTreeDataProvider.update(coder, textDocumentPaths, gitIgnoredFiles, novaSnippets)
	contextTreeView.reload()
})
