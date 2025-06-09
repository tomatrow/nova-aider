import { type AiderCoderState } from "./types"
import { type TextDocumentPaths } from "./nova-utility"

export type ContextTreeNodeData =
	| { type: "FOLDER"; name: string }
	| { type: "FILE"; absoluteFilePath: string; category: "EDITABLE" | "READONLY" | "SUGGESTED" }
	| {
			type: "SNIPPET"
			absoluteFilePath: string
			characterRange: [begin: number, end: number]
			lineRange: [begin: number, end: number]
			text: string
	  }

export type ContextTreeNode = ContextTreeNodeData & { children: ContextTreeNode[] }

function createContextTree(
	coder: AiderCoderState,
	editorPaths: TextDocumentPaths,
	ignoredFiles: Set<string>,
	snippets: Array<ContextTreeNodeData & { type: "SNIPPET" }>
): ContextTreeNode {
	const children: ContextTreeNode[] = []

	if (snippets.length) {
		const snippetNodes = snippets.map(snippet => ({ ...snippet, children: [] }))

		children.push({
			type: "FOLDER",
			name: "Snippets",
			children: snippetNodes
		})
	}

	if (coder.abs_fnames.length) {
		const editableFileNodes: ContextTreeNode[] = coder.abs_fnames.map(absoluteFilePath => ({
			type: "FILE",
			absoluteFilePath,
			category: "EDITABLE",
			children: []
		}))

		children.push({ type: "FOLDER", name: "Editable", children: editableFileNodes })
	}

	if (coder.abs_read_only_fnames.length) {
		const readonlyFileNodes: ContextTreeNode[] = coder.abs_read_only_fnames.map(
			absoluteFilePath => ({
				type: "FILE",
				absoluteFilePath,
				category: "READONLY",
				children: []
			})
		)

		children.push({ type: "FOLDER", name: "Readonly", children: readonlyFileNodes })
	}

	const suggestablePaths = editorPaths.allTextDocumentPaths.filter(
		tabPath =>
			tabPath.startsWith(nova.workspace.path!) &&
			!ignoredFiles.has(tabPath) &&
			!coder.abs_fnames.includes(tabPath) &&
			!coder.abs_read_only_fnames.includes(tabPath)
	)
	if (suggestablePaths.length) {
		const suggestedNodes: ContextTreeNode[] = suggestablePaths.map(absoluteFilePath => ({
			type: "FILE",
			absoluteFilePath,
			category: "SUGGESTED",
			children: []
		}))

		children.push({ type: "FOLDER", name: "Suggested", children: suggestedNodes })
	}

	return { type: "FOLDER", name: "ROOT", children }
}

export class ContextTreeDataProvider implements TreeDataProvider<ContextTreeNode> {
	rootNode: ContextTreeNode = { type: "FOLDER", name: "ROOT", children: [] }

	update(
		coder: AiderCoderState,
		editorPaths: TextDocumentPaths,
		ignoredFiles: Set<string>,
		snippets: Array<ContextTreeNodeData & { type: "SNIPPET" }>
	) {
		this.rootNode = createContextTree(coder, editorPaths, ignoredFiles, snippets)
	}

	getChildren(node: ContextTreeNode | null): ContextTreeNode[] {
		if (!node) return this.rootNode.children
		return node.children
	}

	getTreeItem(node: ContextTreeNode) {
		switch (node.type) {
			case "FOLDER": {
				return new TreeItem(node.name, TreeItemCollapsibleState.Expanded)
			}
			case "FILE": {
				const treeItem = new TreeItem(
					nova.path.basename(node.absoluteFilePath),
					TreeItemCollapsibleState.None
				)

				treeItem.tooltip = nova.workspace.relativizePath(node.absoluteFilePath)
				treeItem.path = node.absoluteFilePath
				treeItem.command = "dev.ajcaldwell.aider.sidebar.context.double-click"
				treeItem.contextValue = `${node.category}_FILE`

				return treeItem
			}
			case "SNIPPET": {
				const treeItem = new TreeItem(
					`${nova.path.basename(node.absoluteFilePath)} (${node.lineRange[0]} - ${node.lineRange[1]})`,
					TreeItemCollapsibleState.None
				)

				treeItem.tooltip = `${nova.workspace.relativizePath(node.absoluteFilePath)} (${node.lineRange[0]} - ${node.lineRange[1]})`
				treeItem.path = node.absoluteFilePath
				treeItem.command = "dev.ajcaldwell.aider.sidebar.context.double-click"
				treeItem.contextValue = "SNIPPET"

				return treeItem
			}
		}
	}
}
