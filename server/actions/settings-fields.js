/* @flow */
import type { $Response } from "express";
import type { TReqContext } from "hull";

const syncAgent = require("../lib/sync-agent");

function fieldsContactInbound(ctx: TReqContext): $Response {
  const syncAgent = new SyncAgent(ctx);
  return res.json({ 
    options: syncAgent.getContactFieldOptionsInbound() 
  });
}

function fieldsContactOutbound(ctx: TReqContext): $Response {
  const syncAgent = new SyncAgent(ctx);
  return res.json({ 
    options: syncAgent.getContactFieldOptionsOutbound() 
  });
}

module.exports = {
  fieldsContactInbound,
  fieldsContactOutbound
};
