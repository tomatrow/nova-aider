#! /usr/bin/env npx tsx
import { spawnSync } from "child_process"
import { AiderCoderClient } from "../src/AiderCoderClient"
import type { FauxFetchOutput } from "../static/fetch"

async function fauxFetch(input: string | URL, init: RequestInit) {
	const spawnSyncReturn = spawnSync(`/Users/ajcaldwell/src/nova-aider/static/fetch.ts`, [
		new URL(input).toString(),
		JSON.stringify(init)
	])

	const fauxFetchOutput: FauxFetchOutput = JSON.parse(spawnSyncReturn.stdout.toString("utf8"))

	return new Response(fauxFetchOutput.responseBody, fauxFetchOutput.responseInit)
}

async function main() {
	const [_, _1, message] = process.argv

	const client = new AiderCoderClient({ fetch: fauxFetch as typeof fetch })

	const result = await client.run(message ?? "")

	console.log(JSON.stringify(result, null, 4))
}

main()
