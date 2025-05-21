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
	_coder?: AiderCoderState
	_fetch: Fetch
	onChange?(coder?: AiderCoderState): void

	constructor({
		base = "http://127.0.0.1:5000",
		coder,
		fetch = globalThis.fetch,
		onChange
	}: {
		base?: string
		coder?: AiderCoderState
		fetch?: Fetch
		onChange?(coder?: AiderCoderState): void
	} = {}) {
		this._base = base
		this._coder = coder
		this._fetch = fetch
		this.onChange = onChange
	}

	async refresh() {
		try {
			const response = await this._fetch(`${this._base}/api/coder`)
			const coderState: { coder: AiderCoderState } = await response.json()
			this._coder = coderState.coder
			this.onChange?.(this._coder)
			return coderState
		} catch (error) {
			console.error(error)
		}
	}

	async run(message: string) {
		try {
			const response = await this._fetch(`${this._base}/api/coder`, {
				method: "POST",
				body: JSON.stringify({ message }),
				headers: { "Content-Type": "application/json", Accept: "application/json" }
			})

			const responseJSON: {
				message: string
				coder: AiderCoderState
			} = await response.json()

			this._coder = responseJSON.coder
			this.onChange?.(this._coder)

			return responseJSON
		} catch (error) {
			console.log(error)
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
