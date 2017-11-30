/* @flow */
export type TResourceType = "Lead" | "Contact";

export interface ILogger {
  info(message?: any, ...optionalParams: any[]): void;
  error(message?: any, ...optionalParams: any[]): void;
  warn(message?: any, ...optionalParams: any[]): void;
  debug(message?: any, ...optionalParams: any[]): void;
  log(message?: any, ...optionalParams: any[]): void;
}

export interface IMetricsClient {
  value(name: string, value: number): void;
  increment(name: string, value: number): void;
}

export interface IDropdownEntry {
  value: string;
  label: string;
}

export interface ListResult {
  has_more: boolean;
  total_results?: number;
  data: any[];
}

export interface IUserUpdateEnvelope {
  message: Object,
  currentCloseLead?: Object;
  currentCloseContact?: Object;
  skipReason?: string;
}

export interface IFilterResult {
  toInsert: Array<IUserUpdateEnvelope>;
  toUpdate: Array<IUserUpdateEnvelope>;
  toSkip: Array<IUserUpdateEnvelope>;
}

export interface IFilterUtil {
  filterAccounts(envelopes: Array<IUserUpdateEnvelope>): IFilterResult;
  filterUsers(envelopes: Array<IUserUpdateEnvelope>): IFilterResult;
}

export interface IAttributesMapper {
  mapToServiceObject(resource: TResourceType, hullObject: any):any;
  mapToHullAttributeObject(resource: TResourceType, sObject: any): any;
  mapToHullIdentObject(resource: TResourceType, sObject: any): any;
}

export interface ILeadStatus {
  id: string;
  label: string;
}

const SUPPORTED_RESOURCETYPES: Array<TResourceType> = ["Lead", "Contact"];

const CONTACT_FIELDS: Array<Object> = [
  {
    id: "name", label: "Name", in: true, out: true
  },
  {
    id: "title", label: "Title", in: true, out: true
  },
  {
    id: "phones.mobile", label: "Phones > Mobile", in: false, out: true
  },
  {
    id: "phones.office", label: "Phones > Office", in: false, out: true
  },
  {
    id: "phones.direct", label: "Phones > Direct", in: false, out: true
  },
  {
    id: "phones.home", label: "Phones > Home", in: false, out: true
  },
  {
    id: "phones.fax", label: "Phones > Fax", in: false, out: true
  },
  {
    id: "phones.other", label: "Phones > Other", in: false, out: true
  },
  {
    id: "emails.office", label: "Emails > Office", in: false, out: true
  },
  {
    id: "emails.home", label: "Emails > Home", in: false, out: true
  },
  {
    id: "emails.other", label: "Emails > Other", in: false, out: true
  },
  {
    id: "urls.url", label: "Url", in: false, out: true
  },
  {
    id: "phones", label: "Phones", in: true, out: false
  },
  {
    id: "emails", label: "Emails", in: true, out: false
  },
  {
    id: "urls", label: "Urls", in: true, out: false
  },
];

module.exports = {
  SUPPORTED_RESOURCETYPES,
  CONTACT_FIELDS
};
