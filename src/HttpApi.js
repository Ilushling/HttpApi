/**
 * @import {
 *  IHttpApi,
 *  ResponseType,
 *  Headers
 * } from './IHttpApi.js'
 * 
 * @import { IDomainLogger, LoggerOptions } from 'mainlog'
 */

/**
 * @typedef {new (params: HttpApiParams) => IHttpApi} HttpApiConstructable
 */

/**
 * @implements {IHttpApi}
 */
export default class HttpApi {
  /**
   * @typedef {HttpApiDependencies} HttpApiParams
   * @typedef {HttpApiDependencies} HttpApiProperties
   * 
   * @typedef {object} HttpApiDependencies
   * @property {IDomainLogger=} logger
   */

  /**
   * @typedef {object | string | number | boolean | null} JsonType
   */

  /** @type {HttpApiProperties['logger']} */
  #logger;

  /** @param {HttpApiParams} params */
  constructor({ logger } = {}) {
    this.#logger = logger;
  }

  //#region Interfaces
  /** @type {IHttpApi['request']} */
  async request({ url, method, headers, data, responseType, traceId }) {
    const logger = this.#logger;
    const loggerOptions = logger != null
      ? this.#getLoggerOptions({ traceId })
      : undefined;

    if (data != null) {
      const dataType = typeof data;

      switch (dataType) {
        case 'object':
          if (!(data instanceof ArrayBuffer)) {
            headers ??= {};

            headers['Content-Type'] ??= 'application/json';

            data = JSON.stringify(data);
          }
          break;
        case 'string':
          data = JSON.stringify(data);
          break;
      }
    }

    const body = /** @type {string | ArrayBuffer} */ (data);

    /** @type {RequestInit} */
    const fetchOptions = {
      method,
      headers,
      body
    };

    logger?.info('Request', loggerOptions);
    logger?.debug({
      url,
      method,
      headers,
      data,
      responseType
    }, { prefix: 'Request', metadata: loggerOptions?.metadata });

    const startTime = Date.now();

    let response;
    try {
      response = await fetch(url, fetchOptions);
    } catch (e) {
      const totalTime = Date.now() - startTime;

      const error = Object.assign(new Error('Http request error', {
        cause: {
          time: totalTime
        }
      }), {
        name: 'HttpRequestError'
      });

      logger?.error(error, { prefix: 'Request', metadata: loggerOptions?.metadata });

      throw error;
    }

    const totalTime = Date.now() - startTime;

    logger?.info({ time: totalTime }, { prefix: 'Response', metadata: loggerOptions?.metadata });

    const responseHeaders = Object.fromEntries(response.headers);
    const responseStatus = response.status;
    const responseStatusText = response.statusText;

    logger?.debug({
      headers: responseHeaders,
      status: responseStatus,
      statusText: responseStatusText
    }, { prefix: 'Response', metadata: loggerOptions?.metadata });

    const clonedResponse = response.clone();

    let responseData;
    try {
      responseData = await this.#parseResponseData(clonedResponse, responseHeaders, responseType);
    } catch (e) {
      const error = Object.assign(new Error(
        'Http response data parse error'
      ), {
        name: 'HttpResponseDataParseError'
      });

      logger?.error(error, { prefix: 'Response data', metadata: loggerOptions?.metadata });

      if (logger != null) {
        responseData = await response.text();

        logger.debug(responseData, { prefix: 'Response data', metadata: loggerOptions?.metadata });
      }

      throw error;
    }

    logger?.debug(responseData, { prefix: 'Response data', metadata: loggerOptions?.metadata });

    return {
      headers: responseHeaders,
      data: responseData,
      status: responseStatus,
      statusText: responseStatusText
    };
  }
  //#endregion

  //#region Logic
  /**
   * @param {Response} response
   * @param {Headers} responseHeaders
   * @param {ResponseType=} responseType
   * @returns {Promise<JsonType | JsonType[] | ArrayBuffer>}
   */
  async #parseResponseData(response, responseHeaders, responseType) {
    if (responseType == null) {
      const contentType = responseHeaders['Content-Type'] ?? responseHeaders['content-type'];

      switch (contentType) {
        case 'application/json':
          responseType = 'json';
          break;
        case 'application/json; charset=utf-8':
          responseType = 'json';
          break;
        case 'application/octet-stream':
          responseType = 'arrayBuffer';
          break;
        default:
          responseType = 'text';
          break;
      }
    }

    switch (responseType) {
      case 'json':
        return /** @type {Promise<JsonType | JsonType[]>} */ (response.json());
      case 'text':
        return response.text();
      case 'arrayBuffer':
        return response.arrayBuffer();
    }
  }

  /**
   * @param {object} params
   * @param {string=} params.traceId
   * @returns {LoggerOptions}
   */
  #getLoggerOptions({ traceId }) {
    return {
      metadata: {
        correlationId: traceId
      }
    };
  }
  //#endregion
}
