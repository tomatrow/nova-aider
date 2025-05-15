#! /usr/bin/env npx tsx

import { AiderCoderClient } from "../src/AiderCoderClient"

async function main() {
	const [_, _1, message] = process.argv

	const client = new AiderCoderClient()

	const { coder } = await client.run(message)

	console.log(JSON.stringify({ coder }, null, 4))
}

main()
