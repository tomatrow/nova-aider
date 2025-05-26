export function isSameSet<T>(array: Iterable<T>, otherArray: Iterable<T>) {
	const set = new Set(array)
	const otherSet = new Set(otherArray)

	if (set.size !== otherSet.size) return false

	for (const value of set) if (!otherSet.has(value)) return false

	return true
}
