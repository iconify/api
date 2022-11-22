/**
 * Main configuration
 */
export interface AppConfig {
	// Index page
	redirectIndex: string;

	// Region to add to `/version` response
	// Used to tell which server is responding when running multiple servers
	// Requires `enableVersion` to be enabled
	statusRegion: string;

	// Cache root directory
	// Without trailing '/'
	cacheRootDir: string;

	// Host
	host: string;

	// Port
	port: number;

	// Logging
	log: boolean;

	// Allow update
	allowUpdate: boolean;

	// Update key
	updateRequiredParam: string;

	// Update check throttling
	updateThrottle: number;

	// Enables `/version` query
	enableVersion: boolean;

	// Enable icon sets and icon lists
	// Disable this option if you need API to serve only icon data to save memory
	enableIconLists: boolean;

	// Enable icon search
	// Requires `enableIconLists` to be enabled
	// Disable this option if you do not need search functionality
	enableSearchEngine: boolean;

	// Enables filtering icons by style: 'fill' or 'stroke'
	// Works only if search engine is enabled
	allowFilterIconsByStyle: boolean;
}
