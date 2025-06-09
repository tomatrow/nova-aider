export function isNotNil<T>(value: T): value is T & {} {
	return value != null
}

export function isTruthy<T>(value: T): value is Exclude<T, false | 0 | "" | null | undefined> {
	return !!value
}

export function isSameSet<T>(setLike: Iterable<T>, otherSetLike: Iterable<T>) {
	return new Set(setLike).symmetricDifference(new Set(otherSetLike)).size === 0
}
