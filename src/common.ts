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
	path: string
	language?: string
}

export type ChatReferenceItem = ChatReferenceFileItem | ChatReferenceSnippetItem

export function buildChatMessaage(
	message: string,
	options: { chatReferenceList?: ChatReferenceItem[] }
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
