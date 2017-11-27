/* @flow */

import { Request, Response } from "express";
import _ from "lodash";
import { Agent } from "../lib/agent";

export default function statusCheckAction(req: Request, res: Response) {
  if (req.hull && req.hull.ship && req.hull.ship.private_settings) {
    const { ship = {}, client = {}, metric = {} } = req.hull;
    const messages: Array<string> = [];
    let status: string = "ok";
    const agent = new Agent(client, ship, metric);

    if (agent.isAuthenticationConfigured() === false) {
      status = "error";
      messages.push("API Key is not configured. Connector cannot communicate with external service.");
    }

    if (_.isEmpty(_.get(ship, "private_settings.synchronized_segments", []))) {
      status = "error";
      messages.push("No users will be synchronized because no segments are whitelisted.");
    }

    res.json({ status, messages });
    client.put(`${ship.id}/status`, { status, messages });
  }

  res.status(404).json({ status: 404, messages: ["Request doesn't contain data about the connector"] });
}