// @flow
import _ from "lodash";
import type { Request, Response } from "express";

import { CONTACT_FIELDS } from "../lib/shared";

export function contactSendFieldsAction(req: Request, res: Response): void {
  const fields = _.filter(CONTACT_FIELDS, (f) => {
    return f.out;
  });
  const options = _.map(fields, (f) => {
    return { value: f.id, label: f.label };
  });
  return res.json({ options });
}

export function contactFetchFieldsAction(req: Request, res: Response): void {
  const fields = _.filter(CONTACT_FIELDS, (f) => {
    return f.in;
  });
  const options = _.map(fields, (f) => {
    return { value: f.id, label: f.label };
  });
  return res.json({ options });
}
