// Status
let loading = true;

// Queue
type Callback = () => void;
const queue: Callback[] = [];

/**
 * Loaded: run queue
 */
export function loaded() {
	loading = false;

	// Run queue
	let callback: Callback | undefined;
	while ((callback = queue.shift())) {
		try {
			callback();
		} catch (err) {
			console.error(err);
		}
	}
}

/**
 * Get state
 */
export function isLoading() {
	return loading;
}

/**
 * Run when app is ready
 */
export function runWhenLoaded(callback: Callback) {
	if (!loading) {
		callback();
	} else {
		queue.push(callback);
	}
}
