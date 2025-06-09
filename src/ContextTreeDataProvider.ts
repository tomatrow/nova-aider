import { type AiderCoderState } from "./types"
import { type TextDocumentPaths } from "./nova-utility"

export type ContextTreeNodeData =
	| { type: "ROOT" }
	| { type: "FOLDER"; category: "EDITABLE" | "READONLY" | "SUGGESTED" }
	| { type: "FILE"; absoluteFilePath: string; category: "EDITABLE" | "READONLY" | "SUGGESTED" }

export type ContextTreeNode = ContextTreeNodeData & { children: ContextTreeNode[] }

function createContextTree(
	coder: AiderCoderState,
	editorPaths: TextDocumentPaths,
	ignoredFiles: Set<string>
): ContextTreeNode {
	const children: ContextTreeNode[] = []

	if (coder.abs_fnames.length) {
		const editableFileNodes: ContextTreeNode[] = coder.abs_fnames.map(absoluteFilePath => ({
			type: "FILE",
			absoluteFilePath,
			category: "EDITABLE",
			children: []
		}))

		const editableListNode: ContextTreeNode = {
			type: "FOLDER",
			category: "EDITABLE",
			children: editableFileNodes
		}

		children.push(editableListNode)
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

		const readonlyListNode: ContextTreeNode = {
			type: "FOLDER",
			category: "READONLY",
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
			type: "FILE",
			absoluteFilePath,
			category: "SUGGESTED",
			children: []
		}))

		const suggestedListNode: ContextTreeNode = {
			type: "FOLDER",
			category: "SUGGESTED",
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

	getChildren(node: ContextTreeNode | null): ContextTreeNode[] {
		if (!node) return this.rootNode.children
		return node.children
	}

	getTreeItem(node: ContextTreeNode) {
		switch (node.type) {
			case "ROOT":
				const treeItem = new TreeItem("Root", TreeItemCollapsibleState.Expanded)
				return treeItem
			case "FOLDER": {
				const labels = {
					EDITABLE: "Editable",
					READONLY: "Readonly",
					SUGGESTED: "Suggested"
				}
				const treeItem = new TreeItem(
					labels[node.category],
					TreeItemCollapsibleState.Expanded
				)
				return treeItem
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
		}
	}
}
