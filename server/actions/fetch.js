/* @flow */
import type { $Response } from "express";

const { Agent } = require("../lib/agent");

function fetchAction(req: Object, res: $Response): Promise<any[]> {
  const { client, ship, metric } = req.hull;
  const agent = new Agent(client, ship, metric);

  res.json({ ok: true });
  return agent.fetchUpdatedLeads();
}

module.exports = fetchAction;
