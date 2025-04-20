interface AiderCoderState {
	abs_fnames: string[]
}

export class AiderCoderClient {
	base: string
	coder?: AiderCoderState

	constructor({
		base = "http://127.0.0.1:5000",
		coder
	}: { base?: string; coder?: AiderCoderState } = {}) {
		this.base = base
		this.coder = coder
	}

	async fetchState() {
		const response = await fetch(`${this.base}/api/coder`)
		const coderState: { coder: AiderCoderState } = await response.json()
		return coderState
	}

	async refreshState() {
		const responseJSON = await this.fetchState()

		this.coder = responseJSON.coder

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

		this.coder = responseJSON.coder

		return responseJSON
	}
}
