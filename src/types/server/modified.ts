/**
 * Response for `/last-modified` query
 *
 * Key is prefix, value is last modification time number
 */
export interface LastModifiedAPIResponse {
	lastModified: Record<string, number>;
}
