/* @flow */
import type { THullReqContext, THullUserUpdateMessage, THullAccountUpdateMessage } from "hull";

import type {
  THullMetrics,
  THullClient,
  CioConnectorSettings,
  HullFieldDropdownItem
} from "./types";

const MappingUtil = require("./sync-agent/mapping-util");
const FilterUtil = require("./sync-agent/filter-util");
const ServiceClient = require("./service-client");
const CONTACT_FIELDDEFS = require("./sync-agent/contact-fielddefs");

const BASE_API_URL = "https://app.close.io/api/v1";

class SyncAgent {
  /**
   * Gets or sets the client to log metrics.
   *
   * @type {THullMetrics}
   * @memberof SyncAgent
   */
  metricsClient: THullMetrics;

  /**
   * Gets or set the hull-node client.
   *
   * @type {THullClient}
   * @memberof SyncAgent
   */
  hullClient: THullClient;

  /**
   * Gets or sets the mapping utility.
   *
   * @type {MappingUtil}
   * @memberof SyncAgent
   */
  mappingUtil: MappingUtil;

  /**
   * Gets or sets the filter utility.
   *
   * @type {FilterUtil}
   * @memberof SyncAgent
   */
  filterUtil: FilterUtil;

  /**
   * Gets or sets the settings of the current connector instance.
   *
   * @type {CioConnectorSettings}
   * @memberof SyncAgent
   */
  configuredSettings: CioConnectorSettings;

  /**
   * Gets or sets the client to communicate with
   * the close.io API.
   *
   * @type {ServiceClient}
   * @memberof SyncAgent
   */
  serviceClient: ServiceClient;

  /**
   * Creates an instance of SyncAgent.
   * @param {THullReqContext} reqContext The request context.
   * @memberof SyncAgent
   */
  constructor(reqContext: THullReqContext) {
    // Initialize hull clients
    this.metricsClient = reqContext.metric;
    this.hullClient = reqContext.client;

    // Initialize configuration from settings
    const loadedSettings: CioConnectorSettings = _.get(reqContext, "ship.private_settings");
    this.configuredSettings = this.ensureSettings(loadedSettings);
    
    // Configure the filter util
    const configFilterUtil: FilterUtilConfiguration = {
      synchronizedAccountSegments: this.configuredSettings.synchronized_account_segments,
      accountIdHull: this.configuredSettings.lead_identifier_hull
    };
    this.filterUtil = new FilterUtil(configFilterUtil);

    // Configure the mapping util
    const configMappingUtil: CioMappingUtilSettings = {
      attributeMappings: _.pick(this.configuredSettings, [ "lead_attributes_outbound", "lead_attributes_inbound", "contact_attributes_outbound", "contact_attributes_inbound"]),
      leadCreationStatusId: this.configuredSettings.lead_status
    };
    this.mappingUtil = new MappingUtil(configMappingUtil);

    // Configure the service client
    const configServiceClient: CioServiceClientConfiguration = {
      baseApiUrl: BASE_API_URL,
      metricsClient: this.metricsClient,
      loggerClient: this.hullClient.logger
    };

    this.serviceClient = new ServiceClient(configServiceClient);
  }

  /**
   * Returns a list of dropdown items for connector settings
   * representing the inbound contact fields. 
   *
   * @returns {Array<HullFieldDropdownItem>} The list of dropdown items.
   * @memberof SyncAgent
   */
  getContactFieldOptionsInbound(): Array<HullFieldDropdownItem> {
    const fields = _.filter(CONTACT_FIELDDEFS, { in: true });
    const opts = _.map(fields, (f) => {
      return { value: f.id, label: f.label };
    });
    return opts;
  }

  /**
   * Returns a list of dropdown items for connector settings
   * representing the outbound contact fields. 
   *
   * @returns {Array<HullFieldDropdownItem>} The list of dropdown items.
   * @memberof SyncAgent
   */
  getContactFieldOptionsOutbound(): Array<HullFieldDropdownItem> {
    const fields = _.filter(CONTACT_FIELDDEFS, { out: true });
    const opts = _.map(fields, (f) => {
      return { value: f.id, label: f.label };
    });
    return opts;
  }

  /**
   * Ensure that all settings have sensible defaults
   *
   * @param {CioConnectorSettings} settings The original settings.
   * @returns {CioConnectorSettings} The sanitized settings.
   * @memberof SyncAgent
   */
  ensureSettings(settings: CioConnectorSettings): CioConnectorSettings {
    const hullId = _.get(settings, "lead_identifier_hull", "domain");
    const svcId = _.get(settings, "lead_identifier_service", "url");
    const leadStatus = _.get(settings, "lead_status", "N/A");
    const leadAttribsOut: Array<CioOutboundMapping> = _.get(settings, "lead_attributes_outbound", []);
    const leadAttribsIn: Array<string> = _.get(settings, "lead_attributes_inbound", []);
    // Ensure that the identifier for leads is always present
    if (_.find(leadAttribsOut, { hull_field_name: hullId, closeio_field_name: svcId }).length === 0) {
      leadAttribsOut.push({ hull_field_name: hullId, closeio_field_name: svcId });
    }

    if (_.indexOf(leadAttribsIn, svcId) === -1) {
      leadAttribsIn.push(svcId);
    }

    const finalSettings: CioConnectorSettings = _.cloneDeep(settings);
    finalSettings.lead_attributes_outbound = leadAttribsOut;
    finalSettings.lead_attributes_inbound = leadAttribsIn;
    finalSettings.lead_identifier_hull = hullId;
    finalSettings.lead_identifier_service = svcId;

    return finalSettings;
  }
}

module.exports = SyncAgent;
