export interface AiderCoderState {
	/** filenames in the editable context */
	abs_fnames: string[]
	/** filenames in the readonly context */
	abs_read_only_fnames: string[]
	/** ai editing format */
	edit_format: "architect" | "ask" | "code" | "context" | "help"
}

export class AiderCoderClient {
	_base: string
	_coder?: AiderCoderState

	constructor({
		base = "http://127.0.0.1:5000",
		coder
	}: { base?: string; coder?: AiderCoderState } = {}) {
		this._base = base
		this._coder = coder
	}

	async refresh() {
		const response = await fetch(`${this._base}/api/coder`)
		const coderState: { coder: AiderCoderState } = await response.json()
		this._coder = coderState.coder
		return coderState
	}

	async run(message: string) {
		try {
			console.log("[AiderCoderClient.run]", "message", message)

			const response = await fetch(`${this._base}/api/coder`, {
				method: "POST",
				body: JSON.stringify({ message }),
				headers: { "Content-Type": "application/json" }
			})

			const responseText = await response.text()
			console.log("[AiderCoderClient.run]", "responseText", responseText)

			const responseJSON: {
				message: string
				coder: AiderCoderState
			} = JSON.parse(responseText)
			console.log("[AiderCoderClient.run]", "responseJSON", responseJSON)

			this._coder = responseJSON.coder

			return responseJSON
		} catch (error) {
			console.error(error)
			throw error
		}
	}

	async read(files: string[]) {
		if (!files.length) throw new Error("Empty files list")

		return await this.run(`/read ${files.join(" ")}`)
	}

	async add(files: string[]) {
		if (!files.length) throw new Error("Empty files list")

		return await this.run(`/add ${files.join(" ")}`)
	}

	async drop(files: string[]) {
		return await this.run(`/drop ${files.join(" ")}`)
	}

	get base() {
		return this._base
	}

	get coder() {
		return this._coder
	}
}
