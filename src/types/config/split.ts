export interface SplitIconSetConfig {
	// Average chunk size, in bytes. 0 to disable
	chunkSize: number;

	// Minimum number of icons in one chunk
	minIconsPerChunk: number;
}
