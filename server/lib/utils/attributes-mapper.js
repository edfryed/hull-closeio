// @flow
import _ from "lodash";
import { URL } from "url";

import type { TResourceType } from "../shared";
import { IAttributesMapper, SUPPORTED_RESOURCETYPES } from "../shared";

export class AttributesMapper implements IAttributesMapper {
  /**
   * Gets or sets the outbound mappings.
   *
   * @type {Object}
   * @memberof AttributesMapper
   */
  mappingsOutbound: Object;

  /**
   * Gets or sets the inbound mappings.
   *
   * @type {Object}
   * @memberof AttributesMapper
   */
  mappingsInbound: Object;

  /**
   * Gets or sets the custom fields.
   *
   * @type {Array<Object>}
   * @memberof AttributesMapper
   */
  customFields: Array<Object>;

  /**
   * Creates an instance of AttributesMapper.
   * @param {Object} settings The connector settings that contain the attribute mappings.
   * @param {Array<Object>} customFields The list of custom fields from close.io.
   * @memberof AttributesMapper
   */
  constructor(settings: Object, customFields: Array<Object>) {
    this.mappingsOutbound = {};
    this.mappingsInbound = {};
    _.forEach(SUPPORTED_RESOURCETYPES, (r) => {
      _.set(this.mappingsOutbound, r, _.get(settings, `${r.toLowerCase()}_attributes_outbound`, {}));
      _.set(this.mappingsInbound, r, _.get(settings, `${r.toLowerCase()}_attributes_inbound`, []));
    });
    this.customFields = customFields;
  }

  /**
   * Maps a Hull object to a close.io object that can be sent to
   * the close.io API.
   *
   * @param {TResourceType} resource The name of the close.io resource.
   * @param {*} hullObject The user object from hull with nested account object; never an account object itself!
   * @returns {*} The mapped close.io Object.
   * @memberof AttributesMapper
   */
  mapToServiceObject(resource: TResourceType, hullObject: any):any {
    const sObject = { };
    if (resource === "Contact") {
      // Contacts have some pre-defined mappings:
      // Always default to name
      _.set(sObject, "name", _.get(hullObject, "name"));
      // Always pick the lead id from the associated account
      _.set(sObject, "lead_id", _.get(hullObject, "account.closeio/id"));
      // Always process the id, if present
      if (_.has(hullObject, "traits_closeio/id")) {
        _.set(sObject, "id", _.get(hullObject, "traits_closeio/id"));
      }
    } else if (resource === "Lead") {
      // Leads, we need to make sure that we map the user as nested contact
      // if we create a lead. In case of an update, we only process lead fields
      // and handle the contact separately
      if (!hullObject.account["closeio/id"]) {
        const contact = this.mapToServiceObject("Contact", hullObject);
        _.unset(contact, "lead_id"); // no lead_id since we nest it
        _.set(sObject, "contacts", [contact]);
      }

      // Set the lead identifier, if present
      if (hullObject.account["closeio/id"]) {
        _.set(sObject, "id", _.get(hullObject, "account.closeio/id"));
      }

      // Set the url and name
      _.set(sObject, "name", _.get(hullObject, "account.name"));
      _.set(sObject, "url", _.get(hullObject, "account.domain"));
    }

    // This is regular handling from here on, no matter the resource type
    const mappings = _.cloneDeep(_.get(this.mappingsOutbound, resource));

    _.forEach(mappings, (m) => {
      const hullAttribValue = _.get(hullObject, m.hull_field_name);
      if (!_.isNil(hullAttribValue)) {
        const sAttribName = _.get(m, "closeio_field_name");
        if (_.startsWith(sAttribName, "emails") ||
          _.startsWith(sAttribName, "phones") ||
          _.startsWith(sAttribName, "urls")) {
          const arrayAttribName = _.split(sAttribName, ".")[0];
          const typeValue = _.split(sAttribName, ".")[1];
          if (!_.has(sObject, arrayAttribName)) {
            _.set(sObject, arrayAttribName, []);
          }
          const newVal = { type: typeValue };
          _.set(newVal, arrayAttribName.slice(0, -1), hullAttribValue);
          const arrayVal = _.concat(_.get(sObject, arrayAttribName), newVal);
          _.set(sObject, arrayAttribName, arrayVal);
        } else {
          // Regular case, just set whatever we get from hull to the field
          _.set(sObject, sAttribName, hullAttribValue);
        }
      }
    });

    console.log("Mapping Input", hullObject);
    console.log("Mapping Result", sObject);
    return sObject;
  }

  /**
   * Maps a close.io object to an object of traits that can be sent to
   * the Hull platform.
   * Note: This is not a Hull user or account object
   *
   * @param {TResourceType} resource The name of the close.io resource.
   * @param {*} sObject The close.io object.
   * @returns {*} The object containing the information about the traits to set.
   * @memberof AttributesMapper
   */
  mapToHullAttributeObject(resource: TResourceType, sObject: any): any {
    const mappings = _.get(this.mappingsInbound, resource);
    const hObject = { };

    _.forEach(mappings, (m) => {
      if (m === "phones" || m === "emails" || m === "urls") {
        // These are arrays, so we flatten them
        const arrayVal = _.get(sObject, m, []);
        _.forEach(arrayVal, (v) => {
          _.set(hObject, `closeio/${m.slice(0, -1)}_${_.get(v, "type")}`, { value: _.get(v, m.slice(0, -1)) });
        });
      } else if (m === "addresses") {
        // Multiple addresses are not supported,
        // we only store the first one
        if (_.has(sObject, m)) {
          const addresses = _.get(sObject, m, []);
          if (addresses.length > 0) {
            const addressData = addresses[0];
            const attribPrefix = `closeio/address_${_.get(addressData, "label", "office")}`;
            _.forIn(addressData, (v, k) => {
              if (k !== "label") {
                _.set(hObject, `${attribPrefix}_${k}`, { value: v });
              }
            });
          }
        }
      } else if (m !== "opportunities") {
        // Opps are not supported at the moment
        if (!_.isNil(_.get(sObject, m))) {
          _.set(hObject, `closeio/${this.getHumanFieldName(m)}`, { value: _.get(sObject, m) });
        }
      }
    });

    // Ensure that we always set the id from close.io
    if (_.has(sObject, "id")) {
      _.set(hObject, "closeio/id", { value: _.get(sObject, "id") });
    }

    if (resource === "Contact") {
      // Make sure we catch the lead_id properly
      _.set(hObject, "closeio/lead_id", { value: _.get(sObject, "lead_id") });
    } else if (resource === "Lead") {
      _.set(hObject, "domain", { value: _.get(sObject, "url"), operation: "setIfNull" });
      _.set(hObject, "closeio/created_at", { value: _.get(sObject, "date_created"), operation: "setIfNull" });
      _.set(hObject, "closeio/updated_at", { value: _.get(sObject, "date_updated") });
    }

    return hObject;
  }

  /**
   * Creates an identifier object for Hull users and accounts based
   * off the information from the close.io object.
   *
   * @param {TResourceType} resource The name of the close.io resource.
   * @param {*} sObject The close.io object.
   * @returns {*} An object that can be passed to `hullClient.asUser` or `hullClient.asAccount`.
   * @memberof AttributesMapper
   */
  mapToHullIdentObject(resource: TResourceType, sObject: any): any {
    const ident = { };
    if (resource === "Contact") {
      // We cannot say for sure which email address is the proper one,
      // so stick to anonymous_id
      _.set(ident, "anonymous_id", `closeio:${_.get(sObject, "id")}`);
    } else if (resource === "Lead") {
      _.set(ident, "domain", this.normalizeUrl(_.get(sObject, "url")));
    }

    return ident;
  }

  /**
   * Creates a human readable field name if the field is a custom lead field.
   *
   * @param {string} field The technical name of the field.
   * @returns {string} A human-readable field name.
   * @memberof AttributesMapper
   */
  getHumanFieldName(field: string): string {
    const fieldIds = _.map(this.customFields, (c) => { return c.id; });
    let humanName = field;
    if (_.includes(fieldIds, field)) {
      const customField = _.find(this.customFields, (c) => { return c.id === field; });
      humanName = _.get(customField, "name");
    }
    return _.snakeCase(humanName);
  }

  /**
   * Normalizes the url by stripping everything
   * except hostname.
   *
   * @param {string} original The original url string.
   * @returns {string} The normalized url.
   * @memberof AttributesMapper
   */
  normalizeUrl(original: string): string {
    try {
      const closeUrl = new URL(original);
      return closeUrl.hostname;
    } catch (error) {
      return original;
    }
  }
}

export default { AttributesMapper };
