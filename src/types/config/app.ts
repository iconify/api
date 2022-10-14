/**
 * Main configuration
 */
export interface AppConfig {
	// Index page
	redirectIndex: string;

	// Region to add to `/version` response. Used to tell which server is responding when running multiple servers
	statusRegion: string;

	// Cache root directory
	// Without trailing '/'
	cacheRootDir: string;

	// HTTP headers to send
	headers: string[];

	// Port
	port: number;

	// Logging
	log: boolean;
}
