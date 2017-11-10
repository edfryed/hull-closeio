/* @flow */
import _ from "lodash";
import request from "request";
import Promise from "bluebird";

import { HullLogger, MetricClient } from "./shared";

const BASE_URL = "https://app.close.io/api/v1";

/* Helper functions */
function getInvalidApiKeyError(): Error {
  return new Error("The API key is either not present or not considerd a valid key because it is less than 5 characters.");
}

export class CloseIoClient {
  /**
   * Gets or sets the API key to authenticate against
   * the close.io API.
   *
   * @type {string}
   * @memberof CloseIoClient
   */
  apiKey: string;

  /**
   * Gets or sets the logger to for logging purposes.
   *
   * @type {HullLogger}
   * @memberof CloseIoClient
   */
  logger: HullLogger;

  /**
   * Gets or sets the client to use for metrics collection.
   *
   * @type {MetricClient}
   * @memberof CloseIoClient
   */
  metrics: MetricClient;

  /**
   * Creates an instance of CloseIoClient.
   * @param {string} [apiKey] (Optional) The API key to use for authentication.
   * @memberof CloseIoClient
   */
  constructor(apiKey?: string) {
    if (apiKey) {
      this.apiKey = apiKey;
    }
  }


  /**
   * Returns the lead statuses from close.io.
   *
   * @returns {Promise<LeadStatus[]>} A list of lead statuses.
   * @memberof CloseIoClient
   */
  getLeadStatuses(): Promise<LeadStatus[]> {
    if (!this.hasValidApiKey()) {
      if (this.logger) {
        // TODO: Log proper error - consult with @michaloo
        this.logger.debug("connector.auth.notconfigured");
      }
      return Promise.reject(getInvalidApiKeyError());
    }

    const opts = {
      url: `${BASE_URL}/status/lead/`,
      method: "GET",
      auth: {
        user: this.apiKey,
        password: ""
      }
    };

    this.incrementApiCalls(1);

    return new Promise((resolve, reject) => {
      request(opts, (err, response, body) => {
        if (err || response.statusCode >= 400) {
          const msg = err ? err.message : response.statusMessage;
          return reject(msg);
        }

        if (_.isString(body)) {
          body = JSON.parse(body);
        }

        const rawData = body.data;
        let result = [];

        if (_.isArray(rawData)) {
          result = rawData;
        }

        return resolve(result);
      });
    });
  }

  /**
   * Creates a new lead in close.io.
   *
   * @param {*} cioObject The close.io object data.
   * @returns {Promise<any>} The data of the created close.io object.
   * @memberof CloseIoClient
   */
  createLead(cioObject: any):Promise<any> {
    if (!this.hasValidApiKey()) {
      if (this.logger) {
        // TODO: Log proper error - consult with @michaloo
        this.logger.debug("connector.auth.notconfigured");
      }
      return Promise.reject(getInvalidApiKeyError());
    }

    const opts = {
      url: `${BASE_URL}/lead/`,
      method: "POST",
      auth: {
        user: this.apiKey,
        password: ""
      },
      body: cioObject,
      json: true
    };

    this.incrementApiCalls(1);

    return new Promise((resolve, reject) => {
      request(opts, (err, response, body) => {
        if (err || response.statusCode >= 400) {
          const msg = err ? err.message : response.statusMessage;
          return reject(msg);
        }

        return resolve(body);
      });
    });
  }

  /**
   * Checks whether an API call can be successfully performed
   * with the specified API key.
   *
   * @returns {Promise<boolean>} True if the call succeeded; otherwise false.
   * @memberof CloseIoClient
   */
  isAuthenticated(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.hasValidApiKey()) {
        const opts = {
          url: `${BASE_URL}/me`,
          method: "GET",
          auth: {
            user: this.apiKey,
            password: ""
          }
        };

        this.incrementApiCalls(1);

        request(opts, (err, response) => {
          if (err || response.statusCode >= 400) {
            if (this.logger) {
              const msg = err ? err.message : response.statusMessage;
              this.logger.error("connector.auth.error", { details: msg });
            }
            return resolve(false);
          }

          if (this.logger) {
            this.logger.debug("connector.auth.success", { status: response.statusCode });
          }
          return resolve(true);
        });
      } else {
        reject(getInvalidApiKeyError());
      }
    });
  }

  /**
   * Checks whether the API key is theoretically valid.
   *
   * @returns {boolean} True if the API key might be valid; otherwise false.
   * @memberof CloseIoClient
   */
  hasValidApiKey(): boolean {
    if (_.isNil(this.apiKey)) {
      return false;
    }
    console.log("API Key", this.apiKey);
    if (_.isString(this.apiKey) && this.apiKey.length && this.apiKey.length > 5) {
      return true;
    }
    return false;
  }

  /**
   * Increments the number of API calls via the metrics client,
   * if one is configured.
   *
   * @param {number} [value=1] The amount by which API calls will increase; default to one.
   * @memberof CloseIoClient
   */
  incrementApiCalls(value: number = 1): void {
    if (this.metrics) {
      this.metrics.increment("ship.service_api.call", value);
    }
  }
}

/**
 * Represents a lead status in close.io
 *
 * @export
 * @interface LeadStatus
 */
export interface LeadStatus {
  id: string;
  label: string;
}

export default { CloseIoClient };
