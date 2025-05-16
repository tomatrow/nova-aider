#! /usr/bin/env npx tsx

import { AiderCoderClient } from "../src/AiderCoderClient"

async function main() {
	const [_, _1, message] = process.argv

	const client = new AiderCoderClient()

	const result = await client.run(message ?? "")

	console.log(JSON.stringify(result, null, 4))
}

main()
