export interface AiderCoderState {
	/** filenames in the editable context */
	abs_fnames: string[]
	/** filenames in the readonly context */
	abs_read_only_fnames: string[]
	/** ai editing format */
	edit_format: "architect" | "ask" | "code" | "context" | "help"
}

type Fetch = typeof fetch

export class AiderCoderClient {
	_base: string
	_fetch: Fetch

	constructor({
		base = "http://127.0.0.1:5000",
		fetch = globalThis.fetch
	}: {
		base?: string
		fetch?: Fetch
	} = {}) {
		this._base = base
		this._fetch = fetch
	}

	async refresh() {
		try {
			const response = await this._fetch(`${this._base}/api/coder`)
			const coderState: { coder: AiderCoderState } = await response.json()
			return coderState
		} catch (error) {
			console.error(error)
		}
	}

	async run(messages: string[]) {
		try {
			const response = await this._fetch(`${this._base}/api/coder`, {
				method: "POST",
				body: JSON.stringify({ messages }),
				headers: { "Content-Type": "application/json", Accept: "application/json" }
			})

			const responseJSON: {
				messages: string[]
				coder: AiderCoderState
			} = await response.json()

			return responseJSON
		} catch (error) {
			console.log(error)
		}
	}

	get base() {
		return this._base
	}
}
