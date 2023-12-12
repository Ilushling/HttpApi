/**
 * @TODO
 * @typedef {any} Logger
 */

/**
 * @typedef {'GET'|'POST'|'PUT'|'PATCH'|'DELETE'|'OPTIONS'} HttpMethod
 */

/**
 * @typedef {Record<string, string>} HttpHeaders
 */

/**
 * @typedef {'json'|'text'|'arrayBuffer'} ResponseType
 */

/**
 * @typedef {Record<string, string>} ResponseHeaders
 */

/**
 * @typedef {object} RequestOptions
 * @property {string} url
 * @property {HttpMethod=} method
 * @property {HttpHeaders=} headers
 * @property {string|object|ArrayBuffer=} data
 * @property {ResponseType=} responseType
 */

/**
 * @typedef {object} HttpApiParams
 * @property {Logger=} logger
 * @property {boolean=} isLog
 */
export default class HttpApi {
  /** @type {Logger=} */
  #logger;

  /** @type {boolean} */
  #isLog;

  /** @param {HttpApiParams} params */
  constructor({
    logger,
    isLog = false
  } = {}) {
    this.#logger = logger;
    this.#isLog = isLog;
  }

  #getLogger() {
    if (!this.#isLog) {
      return;
    }

    return this.#logger;
  }


  /**
   * @param {RequestOptions} options
   */
  async request({ url, method, headers, data, responseType }) {
    const logger = this.#getLogger();

    if (data != null) {
      const dataType = typeof data;

      headers ??= {};

      const dataTypes = {
        object: () => {
          if (!(data instanceof ArrayBuffer)) {
            data = JSON.stringify(data);
          }

          headers['Content-Type'] ??= 'application/json';
        },
        string: () => {
          data = JSON.stringify(data);
        }
      };

      dataTypes[dataType]();
    }

    const fetchOptions = {
      method,
      headers,
      body: data
    };

    logger?.info('Http request');
    logger?.debug({
      url,
      method,
      headers,
      data,
      responseType
    });

    const startTime = Date.now();

    let response;
    try {
      response = await fetch(url, fetchOptions);
    } catch (e) {
      const totalTime = Date.now() - startTime;

      logger?.error({
        message: 'Http request error',
        time: totalTime
      });

      throw Object.assign(new Error('Http request error'), {
        name: 'HttpRequestError'
      });
    }

    const totalTime = Date.now() - startTime;

    logger?.info('Http response');

    const responseHeaders = Object.fromEntries(response.headers);
    const responseStatus = response.status;
    const responseStatusText = response.statusText;

    logger?.debug({
      responseHeaders,
      responseStatus,
      responseStatusText,
      time: totalTime
    });

    const sourceResponse = response;
    response = response.clone();

    let responseData;
    try {
      responseData = await this.#parseResponseData(response, responseHeaders, responseType);
    } catch (e) {
      responseData = await sourceResponse.text();

      logger?.debug({
        responseData
      });

      throw Object.assign(new Error('Http parse response data error'), {
        name: 'HttpParseResponseDataError'
      });
    }

    logger?.debug({
      responseData
    });

    return {
      headers: responseHeaders,
      data: responseData,
      status: responseStatus,
      statusText: responseStatusText
    };
  }

  /**
   * @param {Response} response
   * @param {ResponseHeaders} responseHeaders
   * @param {ResponseType=} responseType
   */
  async #parseResponseData(response, responseHeaders, responseType) {
    if (responseType == null) {
      const contentType = responseHeaders['Content-Type'] ?? responseHeaders['content-type'];
      const contentTypes = {
        'application/json': 'json',
        'application/json; charset=utf-8': 'json',
        'application/octet-stream': 'arrayBuffer'
      }

      responseType = /** @type {ResponseType} */ (contentTypes[contentType] ?? 'text');
    }

    const responseTypes = {
      json: () => response.json(),
      text: () => response.text(),
      arrayBuffer: () => response.arrayBuffer()
    };

    return responseTypes[responseType]();
  }
}
