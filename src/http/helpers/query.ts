/**
 * Basic cleanup for parameters
 */
export function cleanupQueryValue(value: string | undefined) {
	return value ? value.replace(/['"<>&]/g, '') : undefined;
}
