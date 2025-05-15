import { resolve } from "path"
import { UserConfig, defineConfig } from "vite"

export default defineConfig(() => {
	const config: UserConfig = {
		build: {
			lib: {
				name: "nova-aider",
				entry: [resolve(__dirname, "src/main.ts")],
				formats: ["cjs"],
				fileName: (_, name) => name + ".js"
			},
			rollupOptions: {
				external: ["http", "querystring"]
			},
			commonjsOptions: {
				include: [/node_modules/]
			},
			outDir: "Aider.novaextension/Scripts",
			minify: false
		},
		plugins: []
	}
	return config
})
