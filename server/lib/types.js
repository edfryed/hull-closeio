/* @flow */
import type {
  HullAccount, HullUserIdent, HullAccountIdent,
  HullUserAttributes, HullAccountAttributes, HullUser,
  HullUserUpdateMessage, HullAccountUpdateMessage
} from "hull";

/*
 *** Hull Types. Replace when 0.14.0 is released
 */

export type HullMetrics = {
  increment(name: string, value: number, ...params: any[]): void,
  value(name: string, value: number, ...params: any[]): void
};

export type HullClientLogger = {
  log(message: ?any, ...optionalParams: any[]):void;
  info(message: ?any, ...optionalParams: any[]):void;
  warn(message: ?any, ...optionalParams: any[]):void;
  error(message: ?any, ...optionalParams: any[]):void;
  debug(message: ?any, ...optionalParams: any[]):void;
};

export type HullClientConfiguration = {
  prefix: string;
  domain: string;
  protocol: string;
  id: string;
  secret: string;
  organization: string;
  version: string;
};

export type HullClientApiOptions = {
  timeout: number;
  retry: number;
};

export type HullClientUtilTraits = {
  group(user: HullUser | HullAccount): Object;
  normalize(traits: Object): HullUserAttributes;
};

export type HullClientUtils = {
  traits: HullClientUtilTraits
};

export type HullClientTraitsContext = {
  source: string;
};

/**
 * This is an event name which we use when tracking an event
 */
export type HullEventName = string;

/**
 * This is are event's properties which we use when tracking an event
 */
export type HullEventProperties = {
  [HullEventProperty: string]: string
};

/**
 * This is additional context passed with event
 */
export type HullEventContext = {
  location?: {},
  page?: {
    referrer?: string
  },
  referrer?: {
    url: string
  },
  os?: {},
  useragent?: string,
  ip?: string | number
};

export type HullClient = {
  configuration: HullClientConfiguration;
  asUser(ident: HullUserIdent): HullClient;
  asAccount(ident: HullAccountIdent): HullClient;
  logger: HullClientLogger;
  traits(attributes: HullUserAttributes | HullAccountAttributes, context: HullClientTraitsContext): Promise<any>; // Needs to be refined further
  track(event: string, properties: HullEventProperties, context: HullEventContext): Promise<any>;
  get(url: string, params?: Object, options?: HullClientApiOptions): Promise<any>;
  post(url: string, params?: Object, options?: HullClientApiOptions): Promise<any>;
  put(url: string, params?: Object, options?: HullClientApiOptions): Promise<any>;
  del(url: string, params?: Object, options?: HullClientApiOptions): Promise<any>;
  account(ident: HullAccountIdent): HullClient;
  utils: HullClientUtils;
};


/*
 *** Close.io Types, specific to this connector
 */

export type CioObjectType = "Lead" | "Contact";

export type CioCustomFieldType = string | number | Date | Array<string> | Array<number>;

export type CioOutboundMapping = {
  hull_field_name: string,
  closeio_field_name: string
};

export type CioConnectorSettings = {
  api_key: string,
  synchronized_account_segments: Array<string>,
  lead_status: string,
  lead_attributes_outbound: Array<CioOutboundMapping>,
  lead_attributes_inbound: Array<string>,
  contact_attributes_outbound: Array<CioOutboundMapping>,
  contact_attributes_inbound: Array<string>
};

export type CioAttributesMapping = {
  lead_attributes_outbound: Array<CioOutboundMapping>,
  lead_attributes_inbound: Array<string>,
  contact_attributes_outbound: Array<CioOutboundMapping>,
  contact_attributes_inbound: Array<string>
};

export type CioMappingUtilSettings = {
  attributeMappings: CioAttributesMapping,
  leadCreationStatusId: string
};

export type ConnectorOperationResult = "success" | "error" | "skip";

export type CioAddress = {
  label: string,
  address_1: string,
  address_2?: string,
  city: string,
  state?: string,
  zipcode?: string,
  country?: string
};

export type CioPhone = {
  phone: string,
  phone_formatted?: string,
  type: string
};

export type CioEmail = {
  type: string,
  email: string,
  email_lower?: string
};

export type CioLead = {
  id?: string,
  status_id?: string,
  status_label?: string,
  tasks?: Array<any>,
  display_name?: string,
  addresses?: Array<CioAddress>,
  name: string,
  date_updated?: Date,
  html_url?: string,
  created_by?: string,
  organization_id?: string,
  url?: string,
  opportunities?: Array<any>,
  updated_by?: string,
  date_created?: string,
  description?: string,
  [string]: CioCustomFieldType
};

export type CioContact = {
  id?: string,
  lead_id: string,
  name: string,
  title?: string,
  phones?: Array<CioPhone>,
  emails?: Array<CioEmail>
}

export type FilterResults<T> = {
  toSkip: Array<T>,
  toInsert: Array<T>,
  toUpdate: Array<T>,
  toDelete?: Array<T>
};

export type UserUpdateEnvelope = {
  message: HullUserUpdateMessage,
  hullUser: HullUser,
  contact: CioContact,
  skipReason?: string,
  opsResult?: ConnectorOperationResult
};

export type AccountUpdateEnvelope = {
  message: HullAccountUpdateMessage,
  hullAccount: HullAccount,
  lead: CioLead,
  skipReason?: string,
  opsResult?: ConnectorOperationResult
};