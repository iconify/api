/**
 * Handle sync/async code
 */
export async function maybeAwait<T>(value: T | Promise<T>): Promise<T> {
	if (value instanceof Promise) {
		return value;
	}
	return new Promise((fulfill) => {
		fulfill(value);
	});
}
