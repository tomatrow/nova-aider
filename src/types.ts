export interface AiderCoderState {
	/** filenames in the editable context */
	abs_fnames: string[]
	/** filenames in the readonly context */
	abs_read_only_fnames: string[]
	/** ai editing format */
	edit_format: "architect" | "ask" | "code" | "context" | "help"
}
