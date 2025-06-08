import { type AiderCoderState } from "./types"

export type ContextTreeNodeData =
	| { type: "ROOT" }
	| { type: "READONLY_LIST" }
	| { type: "READONLY_FILE"; absoluteFilePath: string }
	| { type: "EDITABLE_LIST" }
	| { type: "EDITABLE_FILE"; absoluteFilePath: string }

export type ContextTreeNode = ContextTreeNodeData & { children: ContextTreeNode[] }

function createContextTree(coder: AiderCoderState): ContextTreeNode {
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

	return { type: "ROOT", children }
}

export class ContextTreeDataProvider implements TreeDataProvider<ContextTreeNode> {
	rootNode: ContextTreeNode = { type: "ROOT", children: [] }

	update(coder?: AiderCoderState) {
		this.rootNode = coder ? createContextTree(coder) : { type: "ROOT", children: [] }
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
			case "EDITABLE_FILE":
			case "READONLY_FILE": {
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
