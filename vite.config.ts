import { resolve } from "path"
import { type UserConfig, defineConfig } from "vite"

export default defineConfig(() => {
	const config: UserConfig = {
		publicDir: "static",
		build: {
			lib: {
				name: "nova-aider",
				entry: [resolve(__dirname, "src/main.ts")],
				formats: ["cjs"],
				fileName: (_, name) => name + ".js"
			},
			commonjsOptions: {
				include: [/node_modules/]
			},
			outDir: "Aider.novaextension/Scripts",
			minify: false
		}
	}

	return config
})
