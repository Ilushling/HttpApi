/**
 * @typedef {object} IDecoratorHttpApi
 * @property {(options: HttpRequestOptions) => Promise<HttpResponse>} request
 */

/**
 * @typedef {new (params: DecoratorHttpApiParams) => IDecoratorHttpApi} DecoratorHttpApiConstructable
 */

/**
 * @typedef {object} DecoratorHttpApiParams
 * @property {IHttpApi} httpApi
 */

/**
 * @typedef {import('./IHttpApi.js').IHttpApi} IHttpApi
 */

/**
 * @typedef {import('./IHttpApi.js').HttpRequestOptions} HttpRequestOptions
 * @typedef {import('./IHttpApi.js').HttpResponse} HttpResponse
 */
