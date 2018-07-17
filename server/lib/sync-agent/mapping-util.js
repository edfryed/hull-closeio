/* @flow */
import type { THullUser, THullAccount } from "hull";
import type { CioObjectType, CioLead, CioAttributesMapping, CioOutboundMapping, CioMappingUtilSettings } from "../types";

const _ = require("lodash");

const SHARED_MESSAGES = require("../shared-messages");
const { LogicError } = require("hull/lib/errors");

class MappingUtil {

  /**
   * Gets or set the attribute mappings for all object types.
   *
   * @type {CioAttributesMapping}
   * @memberof MappingUtil
   */
  attributeMappings: CioAttributesMapping;

  /**
   * Gets or sets the identifier for the lead creation status.
   * Set to "N/A" if default status shall be used.
   *
   * @type {string}
   * @memberof MappingUtil
   */
  leadCreationStatusId: string;


  /**
   *Creates an instance of MappingUtil.
   * @param {CioMappingUtilSettings} settings The settings to configure the util.
   * @memberof MappingUtil
   */
  constructor(settings: CioMappingUtilSettings) {
    this.attributeMappings = settings.attributeMappings;
    this.leadCreationStatusId = settings.leadCreationStatusId;
  }

  /**
   * Maps a hull object to the specified close.io object.
   *
   * @template T The type of close.io object.
   * @param {CioObjectType} objType The close.io object type.
   * @param {(THullUser | THullAccount)} hullObject The hull object.
   * @returns {T} The mapped close.io object.
   * @memberof MappingUtil
   */
  mapToServiceObject<T>(objType: CioObjectType, hullObject: THullUser | THullAccount): T {
    if (this.attributeMappings === null || 
        _.get(this.attributeMappings, `${objType.toLowerCase()}_attributes_outbound`, []).length === 0 || 
        (_.get(this.attributeMappings, `${objType.toLowerCase()}_attributes_outbound`, []).length === 1 && 
         _.keys(_.first(_.get(this.attributeMappings, `${objType.toLowerCase()}_attributes_outbound`, []))).length === 0)
    ) {
      const errDetail = SHARED_MESSAGES.MAPPING_NOOUTBOUNDFIELDS();
      throw new LogicError(errDetail.message, "MappingUtil.mapToServiceObject", { objType, hullObject });
    }
    const svcObject = {};
    if (objType === "Lead") {
      // Default properties
      _.set(svcObject, "name", _.get(hullObject, "name"));
      _.set(svcObject, "url", _.get(hullObject, "domain"));

      if(_.get(hullObject, "closeio/id", null) !== null) {
        _.set(svcObject, "id", _.get(hullObject, "closeio/id"));
      } else if (_.get(hullObject, "closeio/id", null) === null && this.leadCreationStatusId !== "N/A" && this.leadCreationStatusId !== "hull-default") {
        _.set(svcObject, "status_id", this.leadCreationStatusId);
      }
    } else if (objType === "Contact") {
      // Default properties
      _.set(svcObject, "name", _.get(hullObject, "name"));
      _.set(svcObject, "lead_id", _.get(hullObject, "account.closeio/id", null));

      if (_.has(hullObject, "traits_closeio/id")) {
        _.set(svcObject, "id", _.get(hullObject, "traits_closeio/id"));
      }
    } else {
      const errDetail = SHARED_MESSAGES.MAPPING_UNSUPPORTEDTYPEOUTBOUND(objType);
      throw new LogicError(errDetail.message, "MappingUtil.mapToServiceObject", { objType, hullObject });
    }

    // Customized mapping
    const mappings = _.get(this.attributeMappings, `${objType.toLowerCase()}_attributes_outbound`, []);

    _.forEach(mappings, (m: CioOutboundMapping) => {
      const hullAttribValue = _.get(hullObject, m.hull_field_name);
      if (!_.isNil(hullAttribValue)) {
        const svcAttribName = _.get(m, "closeio_field_name");
        if (_.startsWith(svcAttribName, "emails") ||
          _.startsWith(svcAttribName, "phones") ||
          _.startsWith(svcAttribName, "urls")) {
          const arrayAttribName = _.split(svcAttribName, ".")[0];
          const typeValue = _.split(svcAttribName, ".")[1];
          if (!_.has(svcObject, arrayAttribName)) {
            _.set(svcObject, arrayAttribName, []);
          }
          const newVal = { type: typeValue };
          _.set(newVal, arrayAttribName.slice(0, -1), hullAttribValue);
          const arrayVal = _.concat(_.get(svcObject, arrayAttribName), newVal);
          _.set(svcObject, arrayAttribName, arrayVal);
        } else {
          // Regular case, just set whatever we get from hull to the field
          _.set(svcObject, svcAttribName, hullAttribValue);
        }
      }
    });
    
    return svcObject;
  }
}

module.exports = MappingUtil;