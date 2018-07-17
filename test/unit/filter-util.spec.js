const _ = require("lodash");

const FilterUtil = require("../../server/lib/sync-agent/filter-util");
const baseNotifierPayloadUser = require("../integration/fixtures/notifier-payloads/user-update.json");
const baseNotifierPayloadAccount = require("../integration/fixtures/notifier-payloads/account-update.json");

const SHARED_MESSAGES = require("../../server/lib/shared-messages");

describe("FilterUtil", () => {
  it("should identify a lead to insert", () => {
    const notifierPayload = _.cloneDeep(baseNotifierPayloadAccount);
    const envelope = {
      message: _.get(notifierPayload, "messages[0]"),
      hullAccount: _.get(notifierPayload, "messages[0].account"),
      lead: {
        name: _.get(notifierPayload, "messages[0].account.name"),
        "custom.lcf_9TB8XYocaq1GQMK5z7MVyOE7TXS1Cys5VycWwTlRBOZ": _.get(notifierPayload, "messages[0].account.external_id")
      }
    };
    const config = {
      synchronizedAccountSegments: ["59f09bc7f9c5a94af600076d"],
      accountIdHull: "external_id"
    };
    const util = new FilterUtil(config);

    const result = util.filterAccounts([envelope]);
    expect(result.toInsert).toHaveLength(1);
    expect(result.toUpdate).toHaveLength(0);
    expect(result.toSkip).toHaveLength(0);
  });

  it("should identify a lead to update", () => {
    const notifierPayload = _.cloneDeep(baseNotifierPayloadAccount);
    const envelope = {
      message: _.get(notifierPayload, "messages[0]"),
      hullAccount: _.get(notifierPayload, "messages[0].account"),
      lead: {
        name: _.get(notifierPayload, "messages[0].account.name"),
        "custom.lcf_9TB8XYocaq1GQMK5z7MVyOE7TXS1Cys5VycWwTlRBOZ": _.get(notifierPayload, "messages[0].account.external_id"),
        id: "lead_534219tidgshk452t38tajfk"
      }
    };
    const config = {
      synchronizedAccountSegments: ["59f09bc7f9c5a94af600076d"],
      accountIdHull: "external_id"
    };
    const util = new FilterUtil(config);

    const result = util.filterAccounts([envelope]);
    expect(result.toInsert).toHaveLength(0);
    expect(result.toUpdate).toHaveLength(1);
    expect(result.toSkip).toHaveLength(0);
  });

  it("should identify a lead to skip if the hull identifier is not present", () => {
    const notifierPayload = _.cloneDeep(baseNotifierPayloadAccount);
    _.unset(notifierPayload, "messages[0].account.external_id");
    const envelope = {
      message: _.get(notifierPayload, "messages[0]"),
      hullAccount: _.get(notifierPayload, "messages[0].account"),
      lead: {
        name: _.get(notifierPayload, "messages[0].account.name"),
        "custom.lcf_9TB8XYocaq1GQMK5z7MVyOE7TXS1Cys5VycWwTlRBOZ": _.get(notifierPayload, "messages[0].account.external_id")
      }
    };
    const config = {
      synchronizedAccountSegments: ["59f09bc7f9c5a94af600076d"],
      accountIdHull: "external_id"
    };
    const util = new FilterUtil(config);

    const result = util.filterAccounts([envelope]);
    expect(result.toInsert).toHaveLength(0);
    expect(result.toUpdate).toHaveLength(0);
    expect(result.toSkip).toHaveLength(1);
    expect(result.toSkip[0].skipReason).toEqual(SHARED_MESSAGES.OPERATION_SKIP_NOACCOUNTIDENT("external_id").message);
  });

  it("should identify a lead to skip if the account is not in a whitelisted segment", () => {
    const notifierPayload = _.cloneDeep(baseNotifierPayloadAccount);
    const envelope = {
      message: _.get(notifierPayload, "messages[0]"),
      hullAccount: _.get(notifierPayload, "messages[0].account"),
      lead: {
        name: _.get(notifierPayload, "messages[0].account.name"),
        "custom.lcf_9TB8XYocaq1GQMK5z7MVyOE7TXS1Cys5VycWwTlRBOZ": _.get(notifierPayload, "messages[0].account.external_id")
      }
    };
    const config = {
      synchronizedAccountSegments: ["someSegmentThatDoesntMatch"],
      accountIdHull: "external_id"
    };
    const util = new FilterUtil(config);

    const result = util.filterAccounts([envelope]);
    expect(result.toInsert).toHaveLength(0);
    expect(result.toUpdate).toHaveLength(0);
    expect(result.toSkip).toHaveLength(1);
    expect(result.toSkip[0].skipReason).toEqual(SHARED_MESSAGES.OPERATION_SKIP_NOMATCHACCOUNTSEGMENTS().message);
  });

  it("should identify a contact to insert", () => {
    const notifierPayload = _.cloneDeep(baseNotifierPayloadUser);
    const envelope = {
      message: _.get(notifierPayload, "messages[0]"),
      hullUser: _.get(notifierPayload, "messages[0].user"),
      contact: {
        name: _.get(notifierPayload, "messages[0].user.name"),
        lead_id: "lead_534219tidgshk452t38tajfk"
      }
    };
    const config = {
      synchronizedAccountSegments: ["59f09bc7f9c5a94af600076d"],
      accountIdHull: "external_id"
    };
    const util = new FilterUtil(config);

    const result = util.filterUsers([envelope]);
    expect(result.toInsert).toHaveLength(1);
    expect(result.toUpdate).toHaveLength(0);
    expect(result.toSkip).toHaveLength(0);
  });

  it("should identify a contact to update", () => {
    const notifierPayload = _.cloneDeep(baseNotifierPayloadUser);
    const envelope = {
      message: _.get(notifierPayload, "messages[0]"),
      hullUser: _.get(notifierPayload, "messages[0].user"),
      contact: {
        name: _.get(notifierPayload, "messages[0].user.name"),
        lead_id: "lead_534219tidgshk452t38tajfk",
        id: "cont_y29g2ohnb3u35hy"
      }
    };
    const config = {
      synchronizedAccountSegments: ["59f09bc7f9c5a94af600076d"],
      accountIdHull: "external_id"
    };
    const util = new FilterUtil(config);

    const result = util.filterUsers([envelope]);
    expect(result.toInsert).toHaveLength(0);
    expect(result.toUpdate).toHaveLength(1);
    expect(result.toSkip).toHaveLength(0);
  });

  it("should identify a contact to skip if not linked to a lead", () => {
    const notifierPayload = _.cloneDeep(baseNotifierPayloadUser);
    const envelope = {
      message: _.get(notifierPayload, "messages[0]"),
      hullUser: _.get(notifierPayload, "messages[0].user"),
      contact: {
        name: _.get(notifierPayload, "messages[0].user.name")
      }
    };
    const config = {
      synchronizedAccountSegments: ["59f09bc7f9c5a94af600076d"],
      accountIdHull: "external_id"
    };
    const util = new FilterUtil(config);

    const result = util.filterUsers([envelope]);
    expect(result.toInsert).toHaveLength(0);
    expect(result.toUpdate).toHaveLength(0);
    expect(result.toSkip).toHaveLength(1);
    expect(result.toSkip[0].skipReason).toEqual(SHARED_MESSAGES.OPERATION_SKIP_NOLINKEDACCOUNT().message);
  });

  it("should identify a contact to skip if linked account is not in matching whitelisted segments", () => {
    const notifierPayload = _.cloneDeep(baseNotifierPayloadUser);
    const envelope = {
      message: _.get(notifierPayload, "messages[0]"),
      hullUser: _.get(notifierPayload, "messages[0].user"),
      contact: {
        name: _.get(notifierPayload, "messages[0].user.name"),
        lead_id: "lead_534219tidgshk452t38tajfk"
      }
    };
    const config = {
      synchronizedAccountSegments: ["segmentThatDoesntMatchFoo"],
      accountIdHull: "external_id"
    };
    const util = new FilterUtil(config);

    const result = util.filterUsers([envelope]);
    expect(result.toInsert).toHaveLength(0);
    expect(result.toUpdate).toHaveLength(0);
    expect(result.toSkip).toHaveLength(1);
    expect(result.toSkip[0].skipReason).toEqual(SHARED_MESSAGES.OPERATION_SKIP_NOMATCHACCOUNTSEGMENTSUSER().message);
  });
});
