/**
 * @typedef {import('mainlog').ILogger} ILogger
 */

/**
 * @typedef {'GET'|'POST'|'PUT'|'PATCH'|'DELETE'|'OPTIONS'} HttpMethod
 * @typedef {Record<string, string>} Headers
 * @typedef {'json'|'text'|'arrayBuffer'} ResponseType
 * @typedef {number} HttpCode
 */

/**
 * @typedef {object} HttpRequestOptions
 * @property {string} url
 * @property {HttpMethod=} method
 * @property {Headers=} headers
 * @property {string|object|ArrayBuffer=} data
 * @property {ResponseType=} responseType
 * 
 * @typedef {object} HttpResponse
 * @property {Headers} headers
 * @property {any} data
 * @property {HttpCode} status
 * @property {string} statusText
 */

/**
 * @typedef {object} HttpApiDependencies
 * @property {ILogger=} logger
 * 
 * @typedef {object} HttpApiConfigs
 * @property {boolean} isLog
 * 
 * @typedef {HttpApiDependencies & HttpApiConfigs} HttpApiProperties
 * 
 * @typedef {object} HttpApiParams
 * @property {ILogger=} logger
 * @property {boolean=} isLog
 */

/**
 * @typedef {object} IHttpApi
 * @property {(params: { configs: HttpApiConfigs }) => void} setup
 * @property {(options: HttpRequestOptions) => Promise<HttpResponse>} request
 */
