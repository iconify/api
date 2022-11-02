/**
 * Parameters for `/keywords` query
 *
 * One of `prefix` or `keyword` parameters must be set
 */
export interface APIv3KeywordsPrefixQuery {
	// Prefix to test: matches for 'foo' include 'foobar', but not 'barfoo'
	prefix: string;
}

export interface APIv3KeywordsFullQuery {
	// Keyword to test: matches for 'foo' include 'foobar' and 'barfoo'
	keyword: string;
}

export type APIv3KeywordsQuery = APIv3KeywordsPrefixQuery | APIv3KeywordsFullQuery;

/**
 * Response for /keywords query
 *
 * Includes request + response
 */
export type APIv3KeywordsResponse = APIv3KeywordsQuery & {
	// Set to true if keyword is invalid
	invalid?: true;

	// True if partial keyword exists as is
	exists: boolean;

	// Keywords that contain partial keyword
	matches: string[];
};
