/* @flow */
import type { Request, Response } from "express";

import cacheManager from "cache-manager";

import { Agent } from "../lib/agent";

const Cache = cacheManager.caching({ store: "memory", max: 100, ttl: 60 });

export default function leadStatusListAction(req: Request, res: Response): void {
  const { client, ship, metric } = req.hull;
  const { secret } = client.configuration();
  const cacheKey = [ship.id, ship.updated_at, secret, "ls"].join("/");
  const agent = new Agent(client, ship, metric);

  if (!agent.isAuthenticationConfigured()) {
    return res.json({ ok: false, error: "The connector is not or not properly authenticated to Close.io.", options: [] });
  }

  return Cache.wrap(cacheKey, () => {
    return agent.fetchLeadStatuses();
  }).then((ls) => {
    const status = (ls || []).map((s) => {
      return { value: s.id, label: s.label };
    });
    status.unshift({ value: "hull-default", label: "(Use default)" });
    return res.json({ ok: true, options: status });
  }).catch((err) => {
    client.logger.error("outgoing.metadata.error", { status: err.status, message: err.message, type: "/status/lead" });
    return res.json({ ok: false, error: err.message, options: [] });
  });
}
