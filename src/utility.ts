export function isNotNil<T>(value: T): value is T & {} {
	return value != null
}

export function isTruthy<T>(value: T): value is Exclude<T, false | 0 | "" | null | undefined> {
	return !!value
}

export function isSameSet<T>(array: Iterable<T>, otherArray: Iterable<T>) {
	const set = new Set(array)
	const otherSet = new Set(otherArray)

	if (set.size !== otherSet.size) return false

	for (const value of set) if (!otherSet.has(value)) return false

	return true
}
