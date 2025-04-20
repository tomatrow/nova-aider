#! /usr/bin/env npx tsx

async function main() {
	const response = await fetch("http://127.0.0.1:5000/api/run", {
		method: "POST",
		body: JSON.stringify({ message: "/help" }),
		headers: { "Content-Type": "application/json" }
	})

	const responseJson = await response.json()

	console.log(JSON.stringify({ responseJson }, null, 4))
}

main()
