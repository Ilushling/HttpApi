/**
 * @implements {IHttpApi}
 */
export default class HttpApi {
  /**
   * @typedef {import('./IHttpApi.js').IHttpApi} IHttpApi
   */

  /**
   * @typedef {import('./IHttpApi.js').ResponseType} ResponseType
   * @typedef {import('./IHttpApi.js').Headers} Headers
   * 
   * @typedef {import('./IHttpApi.js').HttpApiProperties} HttpApiProperties
   * @typedef {import('./IHttpApi.js').HttpApiParams} HttpApiParams
   */

  /**
   * @typedef {import('mainlog').LoggerOptions} LoggerOptions
   */

  // Dependencies
  /** @type {HttpApiProperties['logger']} */
  #logger;

  // Configs
  /** @type {HttpApiProperties['isLog']} */
  #isLog;

  /** @param {HttpApiParams} params */
  constructor({
    logger
  } = {}) {
    this.#logger = logger;

    this.#isLog = false;
  }

  //#region Interface
  /** @type {IHttpApi['setup']} */
  setup({ isLog }) {
    this.#isLog = isLog;
  }

  /** @type {IHttpApi['request']} */
  async request({ url, method, headers, data, responseType, traceId }) {
    const logger = this.#getLogger();
    const loggerOptions = logger != null ? this.getLoggerOptions({ traceId }) : undefined;

    if (data != null) {
      const dataType = typeof data;

      const dataTypes = {
        object: () => {
          if (!(data instanceof ArrayBuffer)) {
            headers ??= {};

            headers['Content-Type'] ??= 'application/json';

            return JSON.stringify(data);
          }
        },
        string: () => {
          return JSON.stringify(data);
        }
      };

      /**
       * @template {string} T
       * @param {T} dataType
       * @returns {T is keyof typeof dataTypes}
       */
      const isDataType = dataType => dataType in dataTypes;
      if (isDataType(dataType)) {
        data = dataTypes[/** @type {keyof typeof dataTypes} */ (dataType)]();
      }
    }

    const body = /** @type {string | ArrayBuffer} */ (data);

    /** @type {RequestInit} */
    const fetchOptions = {
      method,
      headers,
      body
    };

    logger?.info('Http request', loggerOptions);
    logger?.debug({
      url,
      method,
      headers,
      data,
      responseType
    }, loggerOptions);

    const startTime = Date.now();

    let response;
    try {
      response = await fetch(url, fetchOptions);
    } catch (e) {
      const totalTime = Date.now() - startTime;

      const error = Object.assign(
        new Error(
          'Http request error',
          {
            cause: {
              time: totalTime
            }
          }),
        {
          name: 'HttpRequestError'
        }
      );

      logger?.error(error, loggerOptions);

      throw error;
    }

    const totalTime = Date.now() - startTime;

    logger?.info('Http response', loggerOptions);

    const responseHeaders = Object.fromEntries(response.headers);
    const responseStatus = response.status;
    const responseStatusText = response.statusText;

    logger?.debug({
      responseHeaders,
      responseStatus,
      responseStatusText,
      time: totalTime
    }, loggerOptions);

    const sourceResponse = response;
    response = response.clone();

    let responseData;
    try {
      responseData = await this.#parseResponseData(response, responseHeaders, responseType);
    } catch (e) {
      if (logger != null) {
        responseData = await sourceResponse.text();

        logger.debug({ responseData }, loggerOptions);
      }

      const error = Object.assign(new Error('Http response parse error'), {
        name: 'HttpResponseParseError'
      });

      logger?.error(error, loggerOptions);

      throw error;
    }

    logger?.debug({ responseData }, loggerOptions);

    return {
      headers: responseHeaders,
      data: responseData,
      status: responseStatus,
      statusText: responseStatusText
    };
  }
  //#endregion

  //#region Utils
  #getLogger() {
    if (!this.#isLog) {
      return;
    }

    return this.#logger;
  }

  /**
   * @typedef {object | string | number | boolean | null} JsonType
   * 
   * @param {Response} response
   * @param {Headers} responseHeaders
   * @param {ResponseType=} responseType
   * @returns {Promise<JsonType | JsonType[]>}
   */
  async #parseResponseData(response, responseHeaders, responseType) {
    if (responseType == null) {
      const contentType = responseHeaders['Content-Type'] ?? responseHeaders['content-type'];
      const contentTypes = {
        'application/json': /** @type {'json'} */ ('json'),
        'application/json; charset=utf-8': /** @type {'json'} */ ('json'),
        'application/octet-stream': /** @type {'arrayBuffer'} */ ('arrayBuffer')
      }

      if (contentType in contentTypes) {
        responseType = contentTypes[/** @type {keyof typeof contentTypes} */(contentType)];
      } else {
        responseType = 'text';
      }
    }

    /**
     */
    const responseTypes = {
      json: () => /** @type {Promise<JsonType | JsonType[]>} */(response.json()),
      text: () => response.text(),
      arrayBuffer: () => response.arrayBuffer()
    };

    return responseTypes[responseType]();
  }

  /**
   * @param {object} params
   * @param {string} params.traceId
   * @returns {LoggerOptions}
   */
  getLoggerOptions({ traceId }) {
    return {
      metadata: {
        correlationId: traceId
      }
    };
  }
  //#endregion
}
