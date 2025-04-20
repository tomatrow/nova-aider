import polka from "polka"

polka()
	.use((req, res, nxt) => {
		console.log(req.url)
		nxt()
	})
	.post("/mode/:name", (req, res) => {
		console.log(`/${req.params.name}`)
	})
	.listen(+process.env.NOVA_AIDER_POLKA_PORT!, () => {
		console.log(`> Running on localhost:3000`)
	})
