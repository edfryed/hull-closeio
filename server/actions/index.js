const adminHandler = require("./admin-handler");
const contactFieldsActions = require("./contact-fields");
const fetch = require("./fetch");
const leadFields = require("./lead-fields");
const leadStatusList = require("./schema-leadstatus");
const statusCheck = require("./status-check");
const userUpdateHandler = require("./user-update");

module.exports = {
  adminHandler,
  contactSendFields: contactFieldsActions.contactSendFieldsAction,
  contactFetchFields: contactFieldsActions.contactFetchFieldsAction,
  fetch,
  leadFields,
  leadStatusList,
  statusCheck,
  userUpdateHandler
};
