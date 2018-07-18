/* @flow */
import type { $Response } from "express";

const { Agent } = require("../lib/agent");

function leadStatusListAction(req: Object, res: $Response): $Response {
  const { client, ship, metric } = req.hull;
  const { secret } = client.configuration();
  const cacheKey = [ship.id, ship.updated_at, secret, "ls"].join("/");
  const agent = new Agent(client, ship, metric);

  if (!agent.isAuthenticationConfigured()) {
    return res.json({
      ok: false,
      error: "The connector is not or not properly authenticated to Close.io.",
      options: []
    });
  }

  return req.hull.cache
    .wrap(cacheKey, () => {
      return agent.fetchLeadStatuses();
    })
    .then(ls => {
      const status = (ls || []).map(s => {
        return { value: s.id, label: s.label };
      });
      status.unshift({ value: "hull-default", label: "(Use default)" });
      return res.json({ ok: true, options: status });
    })
    .catch(err => {
      client.logger.error("connector.metadata.error", {
        status: err.status,
        message: err.message,
        type: "/leadstatus"
      });
      return res.json({ ok: false, error: err.message, options: [] });
    });
}

module.exports = leadStatusListAction;
