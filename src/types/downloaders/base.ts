/**
 * Downloader type
 */
export type DownloaderType = 'collections' | 'icon-set' | 'full';

/**
 * Status:
 *
 * 'pending-init' - new instance, waiting for init() to run
 * 'initialising' - initialising: _init() is running
 * 'updating' - checking for update: _checkForUpdate() is running
 * true - ready
 * false - fatal error
 */
export type DownloaderStatus = 'pending-init' | 'initialising' | 'updating' | boolean;

/**
 * Callback to run after checking for update
 */
export type DownloaderUpdateCallback = (value: boolean) => void;
