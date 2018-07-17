/* @flow */
import type { THullReqContext, THullUserUpdateMessage, THullAccountUpdateMessage } from "hull";

import type {
  THullMetrics,
  THullClient,
  CioConnectorSettings
} from "./types.js";

const MappingUtil = require("./sync-agent/mapping-util");


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
   * Gets or sets the list of synchronized accounts segments.
   *
   * @type {Array<string>}
   * @memberof SyncAgent
   */
  synchronizedAccountsSegments: Array<string>;


  constructor(reqContext: THullReqContext) {
    // Initialize hull clients
    this.metricsClient = reqContext.metric;
    this.hullClient = reqContext.client;

    // Initialize configuration from settings
    const configuredSettings: CioConnectorSettings = _.get(reqContext, "ship.private_settings");

    this.synchronizedAccountsSegments = configuredSettings.synchronized_account_segments;
    
  }
}

module.exports = SyncAgent;
