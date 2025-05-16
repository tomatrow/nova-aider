import { type AiderCoderState } from "./AiderCoderClient"

type ContextTreeNodeData =
	| { type: "ROOT" }
	| { type: "READONLY_LIST" }
	| { type: "READONLY_FILE"; absoluteFilePath: string }
	| { type: "EDITABLE_LIST" }
	| { type: "EDITABLE_FILE"; absoluteFilePath: string }

type ContextTreeNode = ContextTreeNodeData & { id: string; adjacencies: { id: string }[] }
type ContextTreeGraph = Record<string, ContextTreeNode>

function createContextTreeGraph(coder: AiderCoderState): ContextTreeGraph {
	const nodes: ContextTreeNode[] = []

	const root: ContextTreeNode = { id: "root", type: "ROOT", adjacencies: [] }
	nodes.push(root)

	if (coder.abs_fnames.length) {
		const editableFileNodes = coder.abs_fnames.map(
			(absoluteFilePath): ContextTreeNode => ({
				id: "EDITABLE_FILE_" + absoluteFilePath,
				type: "EDITABLE_FILE",
				adjacencies: [],
				absoluteFilePath
			})
		)

		const editableListNode = {
			id: "editableList",
			type: "EDITABLE_LIST",
			adjacencies: editableFileNodes.map(node => ({ id: node.id }))
		} satisfies ContextTreeNode

		root.adjacencies.push({ id: editableListNode.id })

		nodes.push(editableListNode, ...editableFileNodes)
	}

	if (coder.abs_read_only_fnames.length) {
		const readonlyFileNodes = coder.abs_read_only_fnames.map(
			(absoluteFilePath): ContextTreeNode => ({
				id: "READONLY_FILE" + absoluteFilePath,
				type: "READONLY_FILE",
				adjacencies: [],
				absoluteFilePath
			})
		)

		const readonlyListNode = {
			id: "readonlyList",
			type: "READONLY_LIST",
			adjacencies: readonlyFileNodes.map(node => ({ id: node.id }))
		} satisfies ContextTreeNode

		root.adjacencies.push({ id: readonlyListNode.id })

		nodes.push(readonlyListNode, ...readonlyFileNodes)
	}

	return Object.fromEntries(nodes.map(node => [node.id, node]))
}

export class ContextTreeDataProvider implements TreeDataProvider<ContextTreeNode> {
	graph: ContextTreeGraph = {}

	update(coder?: AiderCoderState) {
		this.graph = coder ? createContextTreeGraph(coder) : {}
		console.log("[ContextTreeDataProvider.update]", JSON.stringify(this.graph))
	}

	getChildren(element: ContextTreeNode | null): ContextTreeNode[] {
		if (!element) return [this.graph.root].filter(node => node !== undefined)
		return (
			element.adjacencies
				.map(adjacency => this.graph[adjacency.id])
				.filter(node => node !== undefined) ?? []
		)
	}

	getTreeItem(element: ContextTreeNode) {
		switch (element.type) {
			case "ROOT":
				const treeItem = new TreeItem("Root", TreeItemCollapsibleState.Expanded)
				treeItem.identifier = element.id
				return treeItem
			case "EDITABLE_LIST": {
				const treeItem = new TreeItem("Editable", TreeItemCollapsibleState.Expanded)
				treeItem.identifier = element.id
				return treeItem
			}
			case "READONLY_LIST": {
				const treeItem = new TreeItem("Readonly", TreeItemCollapsibleState.Expanded)
				treeItem.identifier = element.id
				return treeItem
			}
			case "READONLY_FILE": {
				const treeItem = new TreeItem(
					element.absoluteFilePath,
					TreeItemCollapsibleState.None
				)
				treeItem.identifier = element.id
				treeItem.path = element.absoluteFilePath
				return treeItem
			}
			case "EDITABLE_FILE": {
				const treeItem = new TreeItem(
					element.absoluteFilePath,
					TreeItemCollapsibleState.None
				)
				treeItem.identifier = element.id
				treeItem.path = element.absoluteFilePath
				return treeItem
			}
		}
	}
}
