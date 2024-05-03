/**
 * @typedef {object} IHttpApi
 * @property {(options: HttpRequestOptions) => Promise<HttpResponse>} request
 */

/**
 * @typedef {new (params: HttpApiParams) => IHttpApi} HttpApiConstructable
 */

/**
 * @typedef {object} HttpApiDependencies
 * @property {ILogger=} logger
 * 
 * @typedef {HttpApiDependencies} HttpApiProperties
 * 
 * @typedef {HttpApiProperties} HttpApiParams
 */

/**
 * @typedef {import('mainlog').ILogger} ILogger
 */

/**
 * @typedef {object} HttpRequestOptions
 * @property {string} url
 * @property {HttpMethod=} method
 * @property {Headers=} headers
 * @property {string | object | ArrayBuffer=} data
 * @property {ResponseType=} responseType
 * @property {string=} traceId
 * 
 * @typedef {object} HttpResponse
 * @property {Headers} headers
 * @property {unknown} data
 * @property {HttpCode} status
 * @property {string} statusText
 */

/**
 * @typedef {'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS'} HttpMethod
 * @typedef {Record<string, string>} Headers
 * @typedef {'json' | 'text' | 'arrayBuffer'} ResponseType
 * @typedef {number} HttpCode
 */
