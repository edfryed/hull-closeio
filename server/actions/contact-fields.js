/* @flow */
import type { $Request, $Response } from "express";

const _ = require("lodash");
const shared = require("../lib/shared");

function contactSendFieldsAction(req: $Request, res: $Response): $Response {
  const fields = _.filter(shared.CONTACT_FIELDS, f => {
    return f.out;
  });
  const options = _.map(fields, f => {
    return { value: f.id, label: f.label };
  });
  return res.json({ options });
}

function contactFetchFieldsAction(req: $Request, res: $Response): $Response {
  const fields = _.filter(shared.CONTACT_FIELDS, f => {
    return f.in;
  });
  const options = _.map(fields, f => {
    return { value: f.id, label: f.label };
  });
  return res.json({ options });
}

module.exports = {
  contactSendFieldsAction,
  contactFetchFieldsAction
};
