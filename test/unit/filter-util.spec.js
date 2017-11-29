/* global describe, test, expect */
const _ = require("lodash");
const FilterUtil = require("../../server/lib/utils/filter-util");

describe("FiterUtil", () => {
  test("should default to an empty array if `synchronized_segments` is not present in settings", () => {
    const util = new FilterUtil({});
    expect(util.synchronizedSegments).toEqual([]);
  });

  test("should have the list of segments = require(`synchronized_segments`", () => {
    const segments = ["Close.io - Leads", "Leads"];
    const util = new FilterUtil({ synchronized_segments: segments });
    expect(util.synchronizedSegments).toEqual(segments);
  });

  test("should filter account to insert", () => {
    const envelope = {
      message: {
        user: {
          id: "1234",
          first_name: "John",
          last_name: "Doe",
          email: "johndoe@test.io"
        },
        account: {
          id: "abc-123",
          domain: "test.io",
          name: "Test Co."
        },
        segments: [
          { id: "Close.io - Leads", name: "Close.io - Leads" }
        ],
      }
    };
    const segments = ["Close.io - Leads", "Leads"];
    const util = new FilterUtil({ synchronized_segments: segments });
    const filterResult = util.filterAccounts([envelope]);

    expect(filterResult.toInsert).toEqual([envelope]);
    expect(filterResult.toSkip).toHaveLength(0);
    expect(filterResult.toUpdate).toHaveLength(0);
  });

  test("should filter account to update", () => {
    const envelope = {
      message: {
        user: {
          id: "1234",
          first_name: "John",
          last_name: "Doe",
          email: "johndoe@test.io"
        },
        account: {
          id: "abc-123",
          domain: "test.io",
          name: "Test Co.",
          "closeio/id": "lead_123"
        },
        segments: [
          { id: "Close.io - Leads", name: "Close.io - Leads" }
        ],
      }
    };
    const segments = ["Close.io - Leads", "Leads"];
    const util = new FilterUtil({ synchronized_segments: segments });
    const filterResult = util.filterAccounts([envelope]);

    expect(filterResult.toUpdate).toEqual([envelope]);
    expect(filterResult.toSkip).toHaveLength(0);
    expect(filterResult.toInsert).toHaveLength(0);
  });

  test("should filter account to insert", () => {
    const envelope = {
      message: {
        user: {
          id: "1234",
          first_name: "John",
          last_name: "Doe",
          email: "johndoe@test.io"
        },
        account: {
          id: "abc-123",
          domain: "test.io",
          name: "Test Co."
        },
        segments: [
          { id: "SFDC Accounts", name: "SFDC Accounts" }
        ],
      }
    };
    const segments = ["Close.io - Leads", "Leads"];
    const util = new FilterUtil({ synchronized_segments: segments });
    const filterResult = util.filterAccounts([envelope]);

    const envResult = _.cloneDeep(envelope);
    envResult.skipReason = "Account doesn't belong to synchronized segments.";
    expect(filterResult.toSkip).toEqual([envResult]);
    expect(filterResult.toInsert).toHaveLength(0);
    expect(filterResult.toUpdate).toHaveLength(0);
  });

  test("should filter users to insert", () => {
    const envelope = {
      message: {
        user: {
          id: "1234",
          first_name: "John",
          last_name: "Doe",
          email: "johndoe@test.io"
        },
        account: {
          id: "abc-123",
          domain: "test.io",
          name: "Test Co.",
          "closeio/id": "lead_123"
        },
        segments: [
          { id: "Close.io - Leads", name: "Close.io - Leads" }
        ],
      }
    };
    const segments = ["Close.io - Leads", "Leads"];
    const util = new FilterUtil({ synchronized_segments: segments });
    const filterResult = util.filterUsers([envelope]);

    expect(filterResult.toInsert).toEqual([envelope]);
    expect(filterResult.toSkip).toHaveLength(0);
    expect(filterResult.toUpdate).toHaveLength(0);
  });

  test("should filter users to update", () => {
    const envelope = {
      message: {
        user: {
          id: "1234",
          first_name: "John",
          last_name: "Doe",
          email: "johndoe@test.io",
          "traits_closeio/id": "cont_abc123"
        },
        account: {
          id: "abc-123",
          domain: "test.io",
          name: "Test Co.",
          "closeio/id": "lead_123"
        },
        segments: [
          { id: "Close.io - Leads", name: "Close.io - Leads" }
        ],
      }
    };
    const segments = ["Close.io - Leads", "Leads"];
    const util = new FilterUtil({ synchronized_segments: segments });
    const filterResult = util.filterUsers([envelope]);

    expect(filterResult.toUpdate).toEqual([envelope]);
    expect(filterResult.toSkip).toHaveLength(0);
    expect(filterResult.toInsert).toHaveLength(0);
  });

  test("should filter users to skip because not in segments", () => {
    const envelope = {
      message: {
        user: {
          id: "1234",
          first_name: "John",
          last_name: "Doe",
          email: "johndoe@test.io",
          "traits_closeio/id": "cont_abc123"
        },
        account: {
          id: "abc-123",
          domain: "test.io",
          name: "Test Co.",
          "closeio/id": "lead_123"
        },
        segments: [
          { id: "SFDC Accounts", name: "SFDC Accounts" }
        ],
      }
    };
    const segments = ["Close.io - Leads", "Leads"];
    const util = new FilterUtil({ synchronized_segments: segments });
    const filterResult = util.filterUsers([envelope]);

    const envResult = _.cloneDeep(envelope);
    envResult.skipReason = "User doesn't belong to synchronized segments";

    expect(filterResult.toSkip).toEqual([envResult]);
    expect(filterResult.toUpdate).toHaveLength(0);
  });

  test("should filter users to skip because no account associated", () => {
    const envelope = {
      message: {
        user: {
          id: "1234",
          first_name: "John",
          last_name: "Doe",
          email: "johndoe@test.io",
          "traits_closeio/id": "cont_abc123"
        },
        segments: [
          { id: "Close.io - Leads", name: "Close.io - Leads" }
        ],
      }
    };
    const segments = ["Close.io - Leads", "Leads"];
    const util = new FilterUtil({ synchronized_segments: segments });
    const filterResult = util.filterUsers([envelope]);

    const envResult = _.cloneDeep(envelope);
    envResult.skipReason = "User not associated with account. Cannot create contact without lead in close.io";

    expect(filterResult.toSkip).toEqual([envResult]);
    expect(filterResult.toUpdate).toHaveLength(0);
    expect(filterResult.toInsert).toHaveLength(0);
  });

  test("should filter users to skip because no account with `closeio/id` associated", () => {
    const envelope = {
      message: {
        user: {
          id: "1234",
          first_name: "John",
          last_name: "Doe",
          email: "johndoe@test.io",
          "traits_closeio/id": "cont_abc123"
        },
        account: {
          id: "abc-123",
          domain: "test.io",
          name: "Test Co."
        },
        segments: [
          { id: "Close.io - Leads", name: "Close.io - Leads" }
        ],
      }
    };
    const segments = ["Close.io - Leads", "Leads"];
    const util = new FilterUtil({ synchronized_segments: segments });
    const filterResult = util.filterUsers([envelope]);

    const envResult = _.cloneDeep(envelope);
    envResult.skipReason = "User not associated with account. Cannot create contact without lead in close.io";

    expect(filterResult.toSkip).toEqual([envResult]);
    expect(filterResult.toUpdate).toHaveLength(0);
    expect(filterResult.toInsert).toHaveLength(0);
  });
});
