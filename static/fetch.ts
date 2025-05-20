#! /usr/bin/env npx tsx

export interface FauxFetchOutput {
	responseInit: ResponseInit
	responseBody: string
}

async function main() {
	const [_, _1, url, init] = process.argv

	const guard = url && init
	if (!guard) {
		console.error(JSON.stringify({ error: { name: "Error", message: "Invalid args" } }))

		process.exit(1)
	}

	try {
		console.warn("[fauxFetch]", url, init)

		const response = await fetch(url, JSON.parse(init))
		const { status, headers, statusText } = response

		const fauxFetchOutput: FauxFetchOutput = {
			responseBody: await response.text(),
			responseInit: { status, headers, statusText }
		}

		console.log(JSON.stringify(fauxFetchOutput))
	} catch (error) {
		console.error(JSON.stringify({ error }))
		process.exit(1)
	}
}

main()
