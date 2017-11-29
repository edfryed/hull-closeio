// @flow

import type { Request, Response } from "express";

import { Agent } from "../lib/agent";

function fetchAction(req: Request, res: Response): Promise<any[]> {
  const { client, ship, metric } = req.hull;
  const agent = new Agent(client, ship, metric);

  res.json({ ok: true });
  return agent.fetchUpdatedLeads();
}

module.exports = fetchAction;
