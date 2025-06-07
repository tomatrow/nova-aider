declare global {
	interface Set<T> {
		difference(other: ReadonlySetLike<T>): Set<T>
		intersection(other: ReadonlySetLike<T>): Set<T>
		union(other: ReadonlySetLike<T>): Set<T>
		symmetricDifference(other: ReadonlySetLike<T>): Set<T>
		isSubsetOf(other: ReadonlySetLike<T>): boolean
		isSupersetOf(other: ReadonlySetLike<T>): boolean
		isDisjointFrom(other: ReadonlySetLike<T>): boolean
	}

	interface ReadonlySetLike<T> {
		readonly size: number
		has(value: T): boolean
		keys(): IterableIterator<T>
	}
}

export {}
