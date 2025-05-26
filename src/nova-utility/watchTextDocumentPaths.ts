export interface TextDocumentPaths {
	activeTextDocumentPath?: string
	allTextDocumentPaths: string[]
}

export function getTextDocumentPaths(): TextDocumentPaths {
	return {
		activeTextDocumentPath: nova.workspace.activeTextEditor?.document.path ?? undefined,
		allTextDocumentPaths: nova.workspace.textEditors
			.map(editor => editor.document.path)
			.filter(path => path != null)
			.sort()
	}
}

export function watchTextDocumentPaths(onChange?: (paths: TextDocumentPaths) => void) {
	let paths = getTextDocumentPaths()

	onChange?.(paths)

	function maybeUpdate() {
		const nextPaths = getTextDocumentPaths()
		const isEqual =
			paths.activeTextDocumentPath === nextPaths.activeTextDocumentPath &&
			paths.allTextDocumentPaths.join() === nextPaths.allTextDocumentPaths.join()
		if (isEqual) return

		paths = nextPaths
		onChange?.(paths)
	}

	const intervalId = setInterval(() => {
		maybeUpdate()
	}, 100)

	function dispose() {
		clearInterval(intervalId)
	}

	return {
		[Symbol.dispose]: dispose,
		dispose,
		get paths() {
			return paths
		}
	}
}
