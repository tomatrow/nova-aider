#! /usr/bin/env npx tsx

async function runCommand(message: string): Promise<{ message: string }> {
	const response = await fetch("http://127.0.0.1:5000/api/run", {
		method: "POST",
		body: JSON.stringify({ message }),
		headers: { "Content-Type": "application/json" }
	})

	return await response.json()
}

async function getContextFiles(): Promise<{ abs_fnames: string[] }> {
	const response = await fetch("http://127.0.0.1:5000/api/context")
	return await response.json()
}

async function main() {
	// console.log(JSON.stringify({ responseJson }, null, 4))
}

main()
