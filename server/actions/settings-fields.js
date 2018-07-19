/* @flow */
import type { $Response } from "express";
import type { THullRequest } from "hull";

const SyncAgent = require("../lib/sync-agent");

function fieldsContactInbound(req: THullRequest, res: $Response): $Response {
  const syncAgent = new SyncAgent(req.hull);
  return res.json({
    options: syncAgent.getContactFieldOptionsInbound()
  });
}

function fieldsContactOutbound(req: THullRequest, res: $Response): $Response {
  const syncAgent = new SyncAgent(req.hull);
  return res.json({
    options: syncAgent.getContactFieldOptionsOutbound()
  });
}

function fieldsLeadInbound(req: THullRequest, res: $Response): void {
  const syncAgent = new SyncAgent(req.hull);
  syncAgent
    .getLeadFields({ type: "inbound" })
    .then(options => {
      res.json({ options });
    })
    .catch(() => {
      res.json({ options: [] });
    });
}

function fieldsLeadOutbound(req: THullRequest, res: $Response): void {
  const syncAgent = new SyncAgent(req.hull);
  syncAgent
    .getLeadFields({ type: "outbound" })
    .then(options => {
      res.json({ options });
    })
    .catch(() => {
      res.json({ options: [] });
    });
}

function fieldsStatus(req: THullRequest, res: $Response): void {
  const syncAgent = new SyncAgent(req.hull);
  syncAgent
    .getLeadStatus()
    .then(options => {
      res.json({ options });
    })
    .catch(() => {
      res.json({ options: [] });
    });
}

function fieldsAccountIdent(req: THullRequest, res: $Response): $Response {
  return res.json({
    options: [
      {
        value: "domain",
        label: "Domain"
      },
      {
        value: "external_id",
        label: "External ID"
      }
    ]
  });
}

module.exports = {
  fieldsContactInbound,
  fieldsContactOutbound,
  fieldsLeadInbound,
  fieldsLeadOutbound,
  fieldsStatus,
  fieldsAccountIdent
};
