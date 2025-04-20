export type ChatReferenceFileItem = {
	// this is just fsPath
	id: string
	type: "file"
	fsPath: string
	path: string
	name: string
}

export type ChatReferenceSnippetItem = {
	id: string
	type: "snippet"
	name: string
	content: string
	language?: string
	path: string
}

export type ChatReferenceItem = ChatReferenceFileItem | ChatReferenceSnippetItem

export type ChatType = "ask" | "code" | "architect"

export const DiffFormats = {
	Diff: "diff",
	DiffFenced: "diff-fenced",
	UDiff: "udiff",
	Whole: "whole"
} as const

export type DiffFormat = (typeof DiffFormats)[keyof typeof DiffFormats]

export type ServerChatPayload = {
	chat_type: ChatType
	diff_format: DiffFormat
	message: string
	reference_list: { fs_path: string; readonly: boolean }[]
}

export type ChatReferenceItemWithReadOnly = ChatReferenceItem & { readonly?: boolean }
export type ChatFileItemWithReadOnly = ChatReferenceFileItem & { readonly?: boolean }

export function formatCurrentChatMessage(
	message: string,
	options: { chatReferenceList?: ChatReferenceItemWithReadOnly[] }
) {
	let reference = ""
	if (options.chatReferenceList?.length) {
		const snippetReferences = options.chatReferenceList
			.filter(r => r.type === "snippet")
			.map(
				r =>
					`<snippet fileName="${r.name}" language="${r.language}">\n${r.content}\n</snippet>`
			)
			.join("\n")
		reference = `the following snippets are available:\n${snippetReferences}`
	}

	if (reference) message = `${reference}\n\n${message}`

	return message
}
