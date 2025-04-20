import { spawn, ChildProcess } from "node:child_process"
import type { ServerChatPayload } from "./common"

const shell = "/opt/homebrew/bin/fish"
const env: Record<string, string> = {}

export class AiderChatService {
	private aiderChatProcess: ChildProcess | undefined
	port: number = 0
	cwd: string
	onStarted: () => void = () => {}
	onError: (error: Error) => void = () => {}

	constructor(cwd: string) {
		this.cwd = cwd
	}

	async start() {
		console.log("Starting aider-chat service...")

		const randomPort = Math.floor(Math.random() * 10000) + 10000
		this.port = randomPort

		const options: ConstructorParameters<typeof Process>[1] = {
			cwd: this.cwd,
			env,
			shell
		}

		console.log("[start]", "process options", JSON.stringify(options))

		const pythonPathFile = "/Users/ajcaldwell/.pyenv/shims/python3.12"
		const args = [
			"-m",
			"flask",
			"-A",
			nova.path.normalize(nova.path.join(__dirname, "../server/main.py")),
			"run",
			"--port",
			randomPort.toString()
		]
		console.info("starting aiderChatProcess:", [pythonPathFile, ...args].join(" "))
		this.aiderChatProcess = spawn(pythonPathFile, args, { cwd: this.cwd, env, shell })

		const timer = setTimeout(() => {
			this.stop()
			const timeoutMessage = "aider-chat service start timeout"
			console.error(timeoutMessage)
		}, 1000 * 10)

		this.aiderChatProcess.on("error", error => {
			console.error(`aider-chat-process-stderr: ${error}`)
		})

		this.aiderChatProcess.on("exit", (code, signal) => {
			clearTimeout(timer)
			throw new Error(`aider-chat service exited with code ${code} signal ${signal}`)
		})

		this.aiderChatProcess.on("close", () => {
			clearTimeout(timer)
			throw new Error(`aider-chat service closed`)
		})
	}

	restart() {
		console.info("Restarting aider-chat service...")
		this.stop()
		this.start()
	}

	stop() {
		console.info("Stopping aider-chat service...")
		this.aiderChatProcess?.kill()
		this.aiderChatProcess = undefined
	}

	get serviceUrl() {
		return `http://127.0.0.1:${this.port}`
	}

	async apiChat(
		payload: ServerChatPayload,
		chunkCallback: (data: { name?: string; data: unknown }) => void
	) {
		console.log("[AiderChatService.apiChat]", "payload", JSON.stringify(payload))

		const url = `${this.serviceUrl}/api/chat`
		console.log("[AiderChatService.apiChat]", "url", url)

		const res = await fetch(url, {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(payload)
		})

		console.log("[AiderChatService.apiChat]", "res", res.status)

		const text = await res.text()

		console.log("[AiderChatService.apiChat]", "text", text)
	}

	async apiClearChat() {
		await fetch(`${this.serviceUrl}/api/chat`, {
			method: "DELETE"
		})
	}

	async apiSaveSession(payload: unknown) {
		await fetch(`${this.serviceUrl}/api/chat/session`, {
			method: "PUT",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(payload)
		})
	}

	async apiChatSetting(payload: unknown) {
		await fetch(`${this.serviceUrl}/api/chat/setting`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify(payload)
		})
	}
}
