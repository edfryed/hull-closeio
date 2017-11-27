/* @flow */
import type { Request, Response } from "express";

import cacheManager from "cache-manager";

import { Agent } from "../lib/agent";

const Cache = cacheManager.caching({ store: "memory", max: 100, ttl: 60 });

export default function leadFieldsAction(req: Request, res: Response): void {
  const { client, ship, metric } = req.hull;
  const { secret } = client.configuration();
  const cacheKey = [ship.id, ship.updated_at, secret, "lf"].join("/");
  const agent = new Agent(client, ship, metric);

  if (!agent.isAuthenticationConfigured()) {
    return res.json({ ok: false, error: "The connector is not or not properly authenticated to Close.io.", options: [] });
  }

  return Cache.wrap(cacheKey, () => {
    return agent.getLeadFields();
  }).then((ls) => {
    const fields = (ls || []).map((s) => {
      return { value: s.value, label: s.label };
    });
    return res.json({ options: fields });
  }).catch((err) => {
    client.logger.error("connector.metadata.error", { status: err.status, message: err.message, type: "/fields-lead" });
    return res.json({ ok: false, error: err.message, options: [] });
  });
}
