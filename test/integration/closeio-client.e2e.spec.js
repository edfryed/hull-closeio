import Mitm from "mitm";

import { getLeadStatusesReponseBody } from "./lib/datamock-leadstatuses";
import { CloseIoClient } from "../../server/lib/closeio-client";

describe("CloseIoClient", () => {
  const API_KEY = "abcd12345z";
  let mitm: Mitm;
  let clnt: CloseIoClient;

  beforeEach(() => {
    mitm = Mitm();
    clnt = new CloseIoClient(API_KEY);
  });

  test("should retrieve the lead status upon success", (done) => {
    mitm.on("request", (req, res) => {
      // TODO: Check basic auth header
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(getLeadStatusesReponseBody()));
    });

    clnt.getLeadStatuses().then((statuses) => {
      expect(statuses).toHaveLength(4);
      expect(statuses[0].label).toEqual("Potential");
      done();
    });
  });

  afterEach(() => {
    mitm.disable();
  });
});
