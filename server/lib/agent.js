/* @flow */
import type { IMetricsClient, ILeadStatus, ILogger, IUserUpdateEnvelope, IFilterUtil, IAttributesMapper, IDropdownEntry } from "./shared";

const Promise = require("bluebird");
const _ = require("lodash");
const { DateTime } = require("luxon");

const FilterUtil = require("./utils/filter-util");
const AttributesMapper = require("./utils/attributes-mapper");
const CloseIoClient = require("./closeio-client");


/**
 * Calculates the timestamp to fetch changes from.
 *
 * @param {*} connector The connector instance.
 * @param {number} safetyInterval The safety interval in milliseconds.
 * @param {number} The current unix date.
 * @returns {Date} The timestamp since when to fetch changed leads.
 */
function calculateUpdatedSinceTimestamp(connector: any, safetyInterval: number, nowUnix: number): Date {
  let lastSyncAt = parseInt(_.get(connector, "private_settings.last_sync_at"), 10);
  if (_.isNaN(lastSyncAt)) {
    lastSyncAt = new Date(nowUnix - (1000 * 60 * 60 * 60 * 48));
  }
  const since = new Date(lastSyncAt - safetyInterval);
  return since;
}

/**
 * Composes the query to fetch updated leads. Note close.io can
 * only handle dates, not timestamps.
 *
 * @param {Date} since The timestamp from which on to fetch updated leads.
 * @returns {string} The query that can be passed to the close.io client.
 */
function composeUpdatedAfterQuery(since: Date): string {
  const dt = DateTime.fromJSDate(since);
  const updatedAfter = dt.minus({ days: 1 }).toISODate();
  return `updated > ${updatedAfter}`;
}

class Agent {
  synchronizedSegments: string[];

  hullClient: any;

  metricClient: IMetricsClient;

  closeClient: CloseIoClient;

  leadStatusForCreate: string;

  connector: any;

  leadFieldsInbound: Array<string>;

  logger: ILogger;

  filterUtil: IFilterUtil;

  attributesMapper: IAttributesMapper;

  constructor(hullClient: any, connector: any, metricClient: IMetricsClient) {
    this.connector = connector;
    this.synchronizedSegments = connector.private_settings.synchronized_segments;
    this.leadStatusForCreate = connector.private_settings.lead_status;
    this.leadFieldsInbound = _.uniq(["id"].concat(connector.private_settings.lead_attributes_inbound || ["id", "name", "url"]));
    this.leadFieldsInbound = _.uniq(this.leadFieldsInbound.concat(["name", "url"]));
    this.hullClient = hullClient;
    this.logger = hullClient.logger;
    this.metricClient = metricClient;
    this.closeClient = new CloseIoClient(connector.private_settings.api_key);
    this.closeClient.metrics = this.metricClient;
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
   * @returns {Promise<ILeadStatus[]>} The list of lead statuses.
   * @memberof Agent
   */
  fetchLeadStatuses(): Promise<ILeadStatus[]> {
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
      const contactsFilterResult = this.filterUtil.filterUsers(envelopes);

      _.forEach(leadsFilterResult.toSkip, (e) => {
        this.hullClient.asAccount(e.message.user.account)
          .logger.info("outgoing.account.skip", { reason: e.skipReason });
      });

      _.forEach(contactsFilterResult.toSkip, (e) => {
        this.hullClient.asUser(e.message.user)
          .logger.info("outgoing.user.skip", { reason: e.skipReason });
      });

      const leadCreationOps = [];
      const leadUpdateOps = [];

      _.forEach(leadsFilterResult.toInsert, (e) => {
        const cioObj = this.attributesMapper.mapToServiceObject("Lead", e.message.user);
        const createOps = this.closeClient.createLead(cioObj);
        leadCreationOps.push(createOps);
      });
      _.forEach(leadsFilterResult.toUpdate, (e) => {
        const cioObj = this.attributesMapper.mapToServiceObject("Lead", e.message.user);
        const updateOps = this.closeClient.updateLead(cioObj.id, cioObj);
        leadUpdateOps.push(updateOps);
      });

      return Promise.map(leadCreationOps, (r) => {
        const traitsObj = this.attributesMapper.mapToHullAttributeObject("Lead", r);
        const identObj = this.attributesMapper.mapToHullIdentObject("Lead", r);

        this.hullClient.asAccount(identObj).traits(traitsObj).then(() => {
          this.hullClient.asAccount(identObj).logger.info("outgoing.account.success", {
            data: r
          });
        });

        if (r.contacts && r.contacts.length === 1) {
          const userTraits = this.attributesMapper.mapToHullAttributeObject("Contact", r.contacts[0]);
          const userEnvelope = _.find(envelopes, (e: IUserUpdateEnvelope) => {
            return e.message.user.account.domain === identObj.domain;
          });

          if (userEnvelope) {
            this.hullClient.asUser({
              id: userEnvelope.message.user.id
            }).traits(userTraits).then(() => {
              this.hullClient.asUser({
                id: userEnvelope.message.user.id
              }).logger.info("outgoing.user.success", {
                data: r
              });
            });
          }
        }
      }).catch((err) => {
        this.hullClient.logger.error("outgoing.account.error", {
          reason: err
        });
      }).map(leadUpdateOps, (r) => {
        const traitsObj = this.attributesMapper.mapToHullAttributeObject("Lead", r);
        const identObj = this.attributesMapper.mapToHullIdentObject("Lead", r);

        this.hullClient.asAccount(identObj).traits(traitsObj).then(() => {
          this.hullClient.asAccount(identObj).logger.info("outgoing.account.success", {
            data: r
          });
        });
      }).catch((err) => {
        this.hullClient.logger.error("outgoing.account.error", {
          reason: err
        });
      })
        .then(() => {
          // Handle the contactOps
          const contactOps = [];
          _.forEach(contactsFilterResult.toInsert, (e) => {
            const cioObj = this.attributesMapper.mapToServiceObject("Contact", e.message.user);
            const createOps = this.closeClient.createContact(cioObj);
            contactOps.push(createOps);
          });
          _.forEach(contactsFilterResult.toUpdate, (e) => {
            const cioObj = this.attributesMapper.mapToServiceObject("Contact", e.message.user);
            const updateOps = this.closeClient.updateContact(cioObj.id, cioObj);
            contactOps.push(updateOps);
          });

          return Promise.map(contactOps, (r) => {
            const traitsObj = this.attributesMapper.mapToHullAttributeObject("Contact", r);
            const identObj = this.attributesMapper.mapToHullIdentObject("Contact", r);

            this.hullClient.asUser(identObj).traits(traitsObj).then(() => {
              this.hullClient.asUser(identObj).logger.info("outgoing.user.success", {
                data: r
              });
            });
          }, {
            concurrency: 1
          }).catch((err) => {
            this.hullClient.logger.error("outgoing.user.error", {
              reason: err
            });
          });
        });
    });
  }

  getLeadFields(): Promise<Array<IDropdownEntry>> {
    return this.closeClient.listCustomFields(100, 0).then((cfs) => {
      const customFields: Array<IDropdownEntry> = _.map(cfs, (cf) => {
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

module.exports = {
  calculateUpdatedSinceTimestamp,
  composeUpdatedAfterQuery,
  Agent
};

