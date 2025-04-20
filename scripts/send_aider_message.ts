#! /usr/bin/env npx tsx

import { AiderCoderClient } from "../src/AiderCoderClient"

async function main() {
	const client = new AiderCoderClient()

	const { coder } = await client.run("/help")

	console.log(JSON.stringify({ coder }, null, 4))
}

main()
