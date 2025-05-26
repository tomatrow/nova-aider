import type { FauxFetchOutput } from "../../static/fetch"
import { runAsync } from "./runAsync"

export async function wrappedNodeFetch(input: string, init: RequestInit = {}) {
	const runAsyncReturn = await runAsync(`/Users/ajcaldwell/src/nova-aider/static/fetch.ts`, {
		args: [input, JSON.stringify(init)]
	})

	const { responseInit, responseBody }: FauxFetchOutput = JSON.parse(runAsyncReturn.stdout)

	return {
		...responseInit,
		async text() {
			return responseBody
		},
		async json() {
			return JSON.parse(responseBody)
		}
	} as Response
}
