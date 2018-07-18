/* @flow */
import type { $Response } from "express";
import type { THullRequest } from "hull";


const _ = require("lodash");
const SyncAgent = require("../lib/sync-agent");
const SHARED_MESSAGES = require("../lib/shared-messages");

function statusCheckAction(req: THullRequest, res: $Response): void {
  if (_.has(req, "hull.ship.private_settings")) {
    const { client } = req.hull;
    const connector = _.get(req, "hull.connector", null) || _.get(req, "hull.ship", null);
    const syncAgent = new SyncAgent(req.hull);
    const messages: Array<string> = [];
    let status: string = "ok";
    const agent = new Agent(client, ship, metric);

    if (syncAgent.isAuthenticationConfigured() === false) {
      status = "error";
      messages.push(
        SHARED_MESSAGES.STATUS_ERROR_NOAPIKEY()
      );
    }

    if (_.isEmpty(_.get(ship, "private_settings.synchronized_account_segments", []))) {
      status = "warning";
      messages.push(
        SHARED_MESSAGES.STATUS_WARNING_NOSEGMENTS()
      );
    }

    res.json({ status, messages });
    client.put(`${ship.id}/status`, { status, messages });
    return;
  }

  res.status(404).json({
    status: 404,
    messages: ["Request doesn't contain data about the connector"]
  });
}

module.exports = statusCheckAction;
