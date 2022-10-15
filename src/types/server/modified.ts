/**
 * Response for `/last-modified` query
 *
 * Key is prefix, value is last modification time number
 */
export interface APIv3LastModifiedResponse {
	lastModified: Record<string, number>;
}
