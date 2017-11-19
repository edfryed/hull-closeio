/* @flow */
import _ from "lodash";
import { DateTime } from "luxon";

import { CloseIoClient } from "./closeio-client";
import { MetricClient, LeadStatus, ILogger } from "./shared";

/**
 * Calculates the timestamp to fetch changes from.
 *
 * @export
 * @param {*} connector The connector instance.
 * @param {number} safetyInterval The safety interval in milliseconds.
 * @param {number} The current unix date.
 * @returns {Date} The timestamp since when to fetch changed leads.
 */
export function calculateUpdatedSinceTimestamp(connector: any, safetyInterval: number, nowUnix: number): Date {
  let lastSyncAt = parseInt(_.get(connector, "private_settings.last_sync_at"), 10);
  if (_.isNaN(lastSyncAt)) {
    lastSyncAt = new Date(nowUnix - (1000 * 60 * 60 * 60 * 48));
  }
  console.log("lastSyncAt", lastSyncAt);
  const since = new Date(lastSyncAt - safetyInterval);
  return since;
}

/**
 * Composes the query to fetch updated leads. Note close.io can
 * only handle dates, not timestamps.
 *
 * @export
 * @param {Date} since The timestamp from which on to fetch updated leads.
 * @returns {string} The query that can be passed to the close.io client.
 */
export function composeUpdatedAfterQuery(since: Date): string {
  const dt = DateTime.fromJSDate(since);
  const updatedAfter = dt.minus({ days: 1 }).toISODate();
  return `updated > ${updatedAfter}`;
}

export class Agent {
  synchronizedSegments: string[];

  hullClient: any;

  metricClient: MetricClient;

  closeClient: CloseIoClient;

  leadStatusForCreate: string;

  connector: any;

  leadFieldsInbound: Array<string>;

  logger: ILogger;

  constructor(hullClient: any, connector: any, metricClient: MetricClient) {
    this.connector = connector;
    this.synchronizedSegments = connector.private_settings.synchronized_segments;
    this.leadStatusForCreate = connector.private_settings.lead_status;
    this.leadFieldsInbound = connector.private_settings.lead_attributes_inbound || [];
    this.leadFieldsInbound = _.uniq(this.leadFieldsInbound.concat(["name", "url"]));
    this.hullClient = hullClient;
    this.logger = hullClient.logger;
    this.metricClient = metricClient;
    this.closeClient = new CloseIoClient(connector.private_settings.api_key);
  }

  /**
   * Fetches all lead statuses from close.io.
   *
   * @returns {Promise<LeadStatus[]>} The list of lead statuses.
   * @memberof Agent
   */
  fetchLeadStatuses(): Promise<LeadStatus[]> {
    return this.closeClient.getLeadStatuses();
  }

  /**
   * Fetches all updated leads from close.io.
   *
   * @returns {Promise<any[]>} The list of updated leads.
   * @memberof Agent
   */
  fetchUpdatedLeads(): Promise<any[]> {
    const nowUnix = new Date();
    const sinceTimestamp = calculateUpdatedSinceTimestamp(this.connector, 6000, nowUnix);
    const q = composeUpdatedAfterQuery(sinceTimestamp);

    const data = [];
    return this.closeClient.listLeads(q, this.leadFieldsInbound, 100, 0).then((res) => {
      data.push(res.data);
      if (res.has_more === true) {
        const totalPages = Math.ceil(res.total_results / 100);
        const apiOps = [];
        for (let index = 1; index < totalPages; index++) { // eslint-disable-line no-plusplus
          apiOps.push(this.closeClient.listLeads(q, this.leadFieldsInbound), 100, index);
        }
        return Promise.all(apiOps).then((results) => {
          results.forEach((result) => {
            data.push((result: any).data);
          });
          return Promise.resolve(_.flatten(data));
        });
      }
      return Promise.resolve(_.flatten(data));
    }, (err) => {
      this.logger.error("incoming.job.error", { reason: err });
      return Promise.resolve([]);
    });
  }

  /**
   * Checks whether the API key is provided at all and hypothetically valid.
   *
   * @returns {boolean} True if the API key is present and hypothetically valid; otherwise false.
   * @memberof Agent
   */
  isAuthenticationConfigured(): boolean {
    return this.closeClient.hasValidApiKey();
  }
}

export default { Agent };
