const _ = require("lodash");
const notifierPayload = _.cloneDeep(
  require("../../fixtures/notifier-payloads/account-update.json")
);
const apiResponse = _.cloneDeep(
  require("../../fixtures/api-responses/lead-post.json")
);

module.exports = ctxMock => {
  _.set(
    notifierPayload,
    "messages[0].account['closeio/id']",
    "lead_70jZ5hiVt5X31MZ3vJ0R0GJMqJEihkoF7TtSVFbN2ty"
  );

  const acctData = _.get(notifierPayload, "messages[0].account");

  expect(ctxMock.client.asAccount.mock.calls[0]).toEqual([acctData]);

  const acctTraits = {
    "closeio/id": { operation: "set", value: _.get(apiResponse, "id") },
    "closeio/name": { value: _.get(acctData, "name") },
    "closeio/status": { operation: "set", value: "Potential" },
    "closeio/url": { value: _.get(acctData, "domain") },
    "closeio/description": { value: _.get(apiResponse, "description") },
    "closeio/created_at": {
      operation: "setIfNull",
      value: "2013-02-20T05:30:24.854000+00:00"
    },
    "closeio/updated_at": {
      operation: "set",
      value: "2013-02-20T05:43:41.622000+00:00"
    }
  };

  expect(ctxMock.client.traits.mock.calls[0][0]).toEqual(acctTraits);

  expect(ctxMock.metric.increment.mock.calls).toHaveLength(2);
  expect(ctxMock.metric.increment.mock.calls[0]).toEqual([
    "ship.outgoing.accounts",
    1
  ]);
  expect(ctxMock.metric.increment.mock.calls[1]).toEqual([
    "ship.service_api.call",
    1,
    [
      "method:POST",
      "url:https://app.close.io/api/v1/lead",
      "status:200",
      "statusGroup:2xx",
      "endpoint:POST https://app.close.io/api/v1/lead"
    ]
  ]);

  expect(ctxMock.client.logger.debug.mock.calls).toHaveLength(2); // debug calls from super-agent
  expect(ctxMock.client.logger.error.mock.calls).toHaveLength(0);

  expect(ctxMock.client.logger.info.mock.calls).toHaveLength(1);
  expect(ctxMock.client.logger.info.mock.calls[0][0]).toEqual(
    "outgoing.account.success"
  );
};
