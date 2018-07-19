const _ = require("lodash");
const smartNotifierPayload = _.cloneDeep(
  require("../../fixtures/notifier-payloads/account-update.json")
);

module.exports = () => {
  const accountSegmentId = _.get(
    smartNotifierPayload,
    "messages[0].account_segments[0].id"
  );
  _.set(
    smartNotifierPayload,
    "connector.private_settings.synchronized_account_segments",
    [accountSegmentId]
  );

  return smartNotifierPayload;
};
