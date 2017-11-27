/* @flow */
import _ from "lodash";
import { DateTime } from "luxon";

import { FilterUtil } from "./utils/filter-util";
import { AttributesMapper } from "./utils/attributes-mapper";
import { CloseIoClient } from "./closeio-client";
import { MetricClient, LeadStatus, ILogger, IUserUpdateEnvelope, IFilterUtil, IAttributesMapper, IDropdownEntry } from "./shared";

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

  filterUtil: IFilterUtil;

  attributesMapper: IAttributesMapper;

  constructor(hullClient: any, connector: any, metricClient: MetricClient) {
    this.connector = connector;
    this.synchronizedSegments = connector.private_settings.synchronized_segments;
    this.leadStatusForCreate = connector.private_settings.lead_status;
    this.leadFieldsInbound = _.uniq(["id"].concat(connector.private_settings.lead_attributes_inbound || ["id", "name", "url"]));
    this.leadFieldsInbound = _.uniq(this.leadFieldsInbound.concat(["name", "url"]));
    this.hullClient = hullClient;
    this.logger = hullClient.logger;
    this.metricClient = metricClient;
    this.closeClient = new CloseIoClient(connector.private_settings.api_key);
    this.filterUtil = new FilterUtil(connector.private_settings);
    this.closeClient.listCustomFields(100, 0).then((cf) => {
      this.attributesMapper = new AttributesMapper(connector.private_settings, cf);
    }, (err) => {
      if (this.logger) {
        this.logger.error("connector.metadata.error", err);
      }
      this.attributesMapper = new AttributesMapper(connector.private_settings, []);
    });
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
      console.log(res);
      data.push(res.data);
      if (res.has_more === true) {
        const totalPages = Math.ceil(res.total_results / 100);
        const apiOps = [];
        for (let index = 1; index < totalPages; index++) { // eslint-disable-line no-plusplus
          apiOps.push(this.closeClient.listLeads(q, this.leadFieldsInbound, 100, index));
        }
        return Promise.all(apiOps).then((results) => {
          results.forEach((result) => {
            data.push((result: any).data);
          });
          this.handleFetchResults(_.flatten(data));
          return Promise.resolve(_.flatten(data));
        });
      }
      this.handleFetchResults(_.flatten(data));
      return Promise.resolve(_.flatten(data));
    }, (err) => {
      this.logger.error("incoming.job.error", { reason: err });
      return Promise.resolve([]);
    });
  }


  sendUserMessages(messages: any[]): Promise<any> {
    const envelopes: Array<IUserUpdateEnvelope> = _.map(messages, (m) => {
      return {
        message: m
      };
    });

    const apiOps = _.map(envelopes, (e) => {
      const q = `lead_url in ("${e.message.account.domain}", "http://www.${e.message.account.domain}", "https://${e.message.account.domain}", "https://www.${e.message.account.domain}")`;
      return this.closeClient.listLeads(q, ["id", "url", "name", "contacts"]).then((leads) => {
        console.log("Leads found", leads.data);
        if (leads.data.length > 0) {
          e.currentCloseLead = leads.data[0]; // eslint-disable-line

          if (e.currentCloseLead && e.currentCloseLead.contacts) {
            // Check if the lead has a contact with the same name
            const contact = _.find(e.currentCloseLead.contacts, (c) => {
              return c.name === e.message.user.name;
            });

            if (contact) {
              e.currentCloseContact = contact;
              if (!_.get(e.message.user, "traits_closeio/id")) {
                _.set(e.message.user, "traits_closeio/id", contact.id);
              }
            }
          }
        }
      });
    });

    return Promise.all(apiOps).then(() => {
      _.forEach(envelopes, (e) => {
        if (e.currentCloseLead) {
          _.set(e.message.user.account, "closeio/id", e.currentCloseLead.id);
        }
      });

      const leadsFilterResult = this.filterUtil.filterAccounts(envelopes);

      console.log("Filter result", JSON.stringify(leadsFilterResult));

      _.forEach(leadsFilterResult.toSkip, (e) => {
        this.hullClient.asAccount(e.message.user.account)
          .logger.info("outgoing.account.skip", { reason: e.skipReason });
      });

      const leadOps = [];
      _.forEach(leadsFilterResult.toInsert, (e) => {
        const cioObj = this.attributesMapper.mapToServiceObject("Lead", e.message.user);
        const createOps = this.closeClient.createLead(cioObj);
        leadOps.push(createOps);
      });
      _.forEach(leadsFilterResult.toUpdate, (e) => {
        const cioObj = this.attributesMapper.mapToServiceObject("Lead", e.message.user);
        const updateOps = this.closeClient.updateLead(cioObj.id, cioObj);
        leadOps.push(updateOps);
      });

      return Promise.all(leadOps).then((responses) => {
        _.forEach(responses, (r) => {
          console.log(">>> Response", r);
          const traitsObj = this.attributesMapper.mapToHullAttributeObject("Lead", r);
          const identObj = this.attributesMapper.mapToHullIdentObject("Lead", r);

          this.hullClient.asAccount(identObj).traits(traitsObj);
          this.hullClient.asAccount(identObj).logger.info("outgoing.account.success", { data: r });

          console.log("Contacts of lead", r.contacts);
          // Only for created leads, handle the contact as user
          if (r.contacts && r.contacts.length === 1) {
            const userTraits = this.attributesMapper.mapToHullAttributeObject("Contact", r.contacts[0]);
            const userEnvelope = _.find(envelopes, (e: IUserUpdateEnvelope) => {
              console.log("Envelope find", identObj.domain, e.message.user);
              return e.message.user.account.domain === identObj.domain;
            });

            console.log("User envelope", userEnvelope, identObj, envelopes);

            if (userEnvelope) {
              this.hullClient.asUser({ id: userEnvelope.message.user.id }).traits(userTraits);
              this.hullClient.asUser({ id: userEnvelope.message.user.id })
                .logger.info("outgoing.user.success", { data: r });
            }
          }
        });
      }, (err) => {
        this.hullClient.logger.error("outgoing.account.error", { reason: err });
      });
    });
  }

  getLeadFields(): Promise<Array<IDropdownEntry>> {
    return this.closeClient.listCustomFields(100, 0).then((cfs) => {
      console.log("Custom Fields Response", cfs.data);
      const customFields: Array<IDropdownEntry> = _.map(cfs.data, (cf) => {
        console.log("Custom Field", cf);
        return { value: cf.id, label: cf.name };
      });
      const defaultFields: Array<IDropdownEntry> = [
        { value: "name", label: "Name" },
        { value: "url", label: "Url" },
        { value: "description", label: "Description" }
      ];
      const allFields = _.concat(defaultFields, customFields);
      return allFields;
    });
  }

  handleFetchResults(sObjects: Array<Object>): void {
    _.forEach(sObjects, (sObject) => {
      const traitsObj = this.attributesMapper.mapToHullAttributeObject("Lead", sObject);
      const identObj = this.attributesMapper.mapToHullIdentObject("Lead", sObject);

      this.hullClient.asAccount(identObj).traits(traitsObj);
      this.hullClient.asAccount(identObj).logger.info("incoming.account.success", { data: sObject });
    });

    const nowUnix = new Date().getTime();
    this.hullClient.utils.settings.update({ last_sync_at: nowUnix });
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