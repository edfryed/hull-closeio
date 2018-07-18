/* @flow */
import type { CioContactFieldDefinition } from "../types";

const CONTACT_FIELDDEFS: Array<CioContactFieldDefinition> = [
  {
    id: "name",
    label: "Name",
    in: true,
    out: true
  },
  {
    id: "title",
    label: "Title",
    in: true,
    out: true
  },
  {
    id: "phones.mobile",
    label: "Phones > Mobile",
    in: false,
    out: true
  },
  {
    id: "phones.office",
    label: "Phones > Office",
    in: false,
    out: true
  },
  {
    id: "phones.direct",
    label: "Phones > Direct",
    in: false,
    out: true
  },
  {
    id: "phones.home",
    label: "Phones > Home",
    in: false,
    out: true
  },
  {
    id: "phones.fax",
    label: "Phones > Fax",
    in: false,
    out: true
  },
  {
    id: "phones.other",
    label: "Phones > Other",
    in: false,
    out: true
  },
  {
    id: "emails.office",
    label: "Emails > Office",
    in: false,
    out: true
  },
  {
    id: "emails.home",
    label: "Emails > Home",
    in: false,
    out: true
  },
  {
    id: "emails.other",
    label: "Emails > Other",
    in: false,
    out: true
  },
  {
    id: "urls.url",
    label: "Url",
    in: false,
    out: true
  },
  {
    id: "phones",
    label: "Phones",
    in: true,
    out: false
  },
  {
    id: "emails",
    label: "Emails",
    in: true,
    out: false
  },
  {
    id: "urls",
    label: "Urls",
    in: true,
    out: false
  }
];

module.exports = CONTACT_FIELDDEFS;
