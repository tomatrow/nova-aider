import { type AiderCoderState } from "./types"
import { type TextDocumentPaths } from "./nova-utility"

export type ContextTreeNodeData =
	| { type: "ROOT" }
	| { type: "READONLY_LIST" }
	| { type: "READONLY_FILE"; absoluteFilePath: string }
	| { type: "EDITABLE_LIST" }
	| { type: "EDITABLE_FILE"; absoluteFilePath: string }
	| { type: "SUGGESTED_LIST" }
	| { type: "SUGGESTED_FILE"; absoluteFilePath: string }

export type ContextTreeNode = ContextTreeNodeData & { children: ContextTreeNode[] }

function createContextTree(
	coder: AiderCoderState,
	editorPaths: TextDocumentPaths,
	ignoredFiles: Set<string>
): ContextTreeNode {
	const children: ContextTreeNode[] = []

	if (coder.abs_fnames.length) {
		const editableFileNodes: ContextTreeNode[] = coder.abs_fnames.map(absoluteFilePath => ({
			type: "EDITABLE_FILE",
			absoluteFilePath,
			children: []
		}))

		const editableListNode: ContextTreeNode = {
			type: "EDITABLE_LIST",
			children: editableFileNodes
		}

		children.push(editableListNode)
	}

	if (coder.abs_read_only_fnames.length) {
		const readonlyFileNodes: ContextTreeNode[] = coder.abs_read_only_fnames.map(
			absoluteFilePath => ({
				type: "READONLY_FILE",
				absoluteFilePath,
				children: []
			})
		)

		const readonlyListNode: ContextTreeNode = {
			type: "READONLY_LIST",
			children: readonlyFileNodes
		}

		children.push(readonlyListNode)
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
			type: "SUGGESTED_FILE",
			absoluteFilePath,
			children: []
		}))

		const suggestedListNode: ContextTreeNode = {
			type: "SUGGESTED_LIST",
			children: suggestedNodes
		}

		children.push(suggestedListNode)
	}

	return { type: "ROOT", children }
}

export class ContextTreeDataProvider implements TreeDataProvider<ContextTreeNode> {
	rootNode: ContextTreeNode = { type: "ROOT", children: [] }

	update(coder: AiderCoderState, editorPaths: TextDocumentPaths, ignoredFiles: Set<string>) {
		this.rootNode = createContextTree(coder, editorPaths, ignoredFiles)
	}

	getChildren(element: ContextTreeNode | null): ContextTreeNode[] {
		if (!element) return this.rootNode.children
		return element.children
	}

	getTreeItem(element: ContextTreeNode) {
		switch (element.type) {
			case "ROOT":
				const treeItem = new TreeItem("Root", TreeItemCollapsibleState.Expanded)
				return treeItem
			case "EDITABLE_LIST": {
				const treeItem = new TreeItem("Editable", TreeItemCollapsibleState.Expanded)
				return treeItem
			}
			case "READONLY_LIST": {
				const treeItem = new TreeItem("Readonly", TreeItemCollapsibleState.Expanded)
				return treeItem
			}
			case "SUGGESTED_LIST": {
				const treeItem = new TreeItem("Suggested", TreeItemCollapsibleState.Expanded)
				return treeItem
			}
			case "EDITABLE_FILE":
			case "READONLY_FILE":
			case "SUGGESTED_FILE": {
				const treeItem = new TreeItem(
					nova.path.basename(element.absoluteFilePath),
					TreeItemCollapsibleState.None
				)
				treeItem.tooltip = nova.workspace.relativizePath(element.absoluteFilePath)
				treeItem.path = element.absoluteFilePath
				treeItem.command = "dev.ajcaldwell.aider.sidebar.context.double-click"
				treeItem.contextValue = element.type
				return treeItem
			}
		}
	}
}
