export type ChatType = "ask" | "code" | "architect"

export interface AiderCoderState {
	abs_fnames: string[]
	abs_read_only_fnames: string[]
}

export class AiderCoderClient {
	base: string
	_coder?: AiderCoderState

	constructor({
		base = "http://127.0.0.1:5000",
		coder
	}: { base?: string; coder?: AiderCoderState } = {}) {
		this.base = base
		this._coder = coder
	}

	async _fetchState() {
		const response = await fetch(`${this.base}/api/coder`)
		const coderState: { coder: AiderCoderState } = await response.json()
		return coderState
	}

	async refreshState() {
		const responseJSON = await this._fetchState()

		this._coder = responseJSON.coder

		return responseJSON
	}

	async run(message: string) {
		const response = await fetch(`${this.base}/api/coder`, {
			method: "POST",
			body: JSON.stringify({ message }),
			headers: { "Content-Type": "application/json" }
		})

		const responseJSON: {
			message: string
			coder: AiderCoderState
		} = await response.json()

		this._coder = responseJSON.coder

		return responseJSON
	}

	async read(files: string[]) {
		if (!files.length) throw new Error("Empty files list")

		return await this.run(`/read-only ${files.join(" ")}`)
	}

	async add(files: string[]) {
		if (!files.length) throw new Error("Empty files list")

		return await this.run(`/add ${files.join(" ")}`)
	}

	async drop(files: string[]) {
		return await this.run(`/drop ${files.join(" ")}`)
	}

	get coder() {
		return this._coder
	}
}
