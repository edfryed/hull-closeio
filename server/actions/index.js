const {
  fieldsContactInbound,
  fieldsContactOutbound,
  fieldsLeadInbound,
  fieldsLeadOutbound,
  fieldsStatus,
  fieldsAccountIdent
} = require("./settings-fields");
const statusCheck = require("./status-check");
const updateUsers = require("./user-update");
const updateAccounts = require("./account-update");
const fetch = require("./fetch");
const adminHandler = require("./admin-handler");

module.exports = {
  fieldsContactInbound,
  fieldsContactOutbound,
  fieldsLeadInbound,
  fieldsLeadOutbound,
  statusCheck,
  updateUsers,
  updateAccounts,
  fieldsStatus,
  fetch,
  adminHandler,
  fieldsAccountIdent
};
