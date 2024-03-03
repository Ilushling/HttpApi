/**
 * @typedef {import('./IHttpApi.js').ResponseType} ResponseType
 * @typedef {import('./IHttpApi.js').Headers} Headers
 * 
 * @typedef {import('./IHttpApi.js').HttpApiProperties} HttpApiProperties
 * @typedef {import('./IHttpApi.js').HttpApiParams} HttpApiParams
 */

/**
 * @typedef {import('./IHttpApi.js').IHttpApi} IHttpApi
 * 
 * @implements {IHttpApi}
 */
export default class HttpApi {
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

  /** @type {IHttpApi['setup']} */
  setup({ configs }) {
    this.#isLog = configs.isLog;
  }

  #getLogger() {
    if (!this.#isLog) {
      return;
    }

    return this.#logger;
  }

  /** @type {IHttpApi['request']} */
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
    logger?.trace({
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

    logger?.trace({
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

      logger?.trace({
        responseData
      });

      throw Object.assign(new Error('Http parse response data error'), {
        name: 'HttpParseResponseDataError'
      });
    }

    logger?.trace({
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
   * @param {Headers} responseHeaders
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
