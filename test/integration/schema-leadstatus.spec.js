const nock = require("nock");

const { getLeadStatusesReponseBody } = require("../helper/datamock-leadstatuses");

const leadStatusListAction = require("../../server/actions/schema-leadstatus");

const { ShipMock } = require("../helper/shipmock");

describe("leadStatusListAction", () => {
  const BASE_URL = "https://app.close.io/api/v1";

  test("should return lead statuses if the connector is properly configured", (done) => {
    const private_settings = {
      api_key: "1234567abcd="
    };

    nock(BASE_URL)
      .get("/status/lead/")
      .reply(200, function () { // eslint-disable-line func-names
        const authHeader = `Basic ${Buffer.from(`${private_settings.api_key}:`).toString("base64")}`;
        expect(this.req.headers.authorization).toEqual(authHeader);
        return getLeadStatusesReponseBody();
      });
    const metricClientMock = {};
    const incrementMock = jest.fn().mockImplementation(() => {
      console.log("metricClient.increment mocked function called");
    });
    metricClientMock.increment = incrementMock.bind(metricClientMock);

    const responseMock = {};
    const jsonMock = jest.fn().mockImplementation(() => {
      console.log("response.json mocked function called");
    });
    responseMock.json = jsonMock.bind(responseMock);

    const clientMock = {};
    const configMock = jest.fn().mockImplementation(() => {
      return { secret: "1234" };
    });
    clientMock.configuration = configMock.bind(clientMock);

    const req = {
      url: "https://hull-closeio.herokuapp.com/",
      hull: {
        client: clientMock,
        ship: new ShipMock("1234", {}, private_settings)
      }
    };

    const res = leadStatusListAction(req, responseMock);
    res.then(() => {
      const status = getLeadStatusesReponseBody().data.map((s) => {
        return { value: s.id, label: s.label };
      });
      status.unshift({ value: "hull-default", label: "(Use default)" });
      expect(jsonMock.mock.calls[0][0]).toEqual({ ok: true, options: status });
      done();
    });
  });
});
