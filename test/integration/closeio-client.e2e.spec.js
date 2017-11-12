/* @flow */
/* global describe, test, before, beforeEach, afterEach */

import Mitm from "mitm";

import { getLeadStatusesReponseBody } from "./lib/datamock-leadstatuses";
import { getUsersMeResponse } from "./lib/datamock-users";
import { getLeadCreateResponse, getLeadUpdateResponse, getLeadListResponse } from "./lib/datamock-leads";

import { CloseIoClient } from "../../server/lib/closeio-client";

describe("CloseIoClient", () => {
  const API_KEY = "abcd12345z";
  let mitm: Mitm;
  let clnt: CloseIoClient;

  beforeEach(() => {
    mitm = Mitm();
    clnt = new CloseIoClient(API_KEY);
  });

  test("should detect if the API key is not set", () => {
    const clntNoApiKey = new CloseIoClient();
    expect(clntNoApiKey.hasValidApiKey()).toBeFalsy();
  });

  test("should detect if the API key is too short and not valid", () => {
    const clntNoApiKey = new CloseIoClient("12");
    expect(clntNoApiKey.hasValidApiKey()).toBeFalsy();
  });

  test("should increment the api calls if metrics is specified", () => {
    const incrementMock = jest.fn().mockImplementation(() => {
      console.log("mocked function called");
    });
    const metrics = {};
    metrics.increment = incrementMock.bind(metrics);
    clnt.metrics = metrics;
    clnt.incrementApiCalls(3);
    expect(incrementMock.mock.calls[0][0]).toEqual("ship.service_api.call");
    expect(incrementMock.mock.calls[0][1]).toEqual(3);
  });

  test("should retrieve the current user profile upon authentication check", (done) => {
    mitm.on("request", (req, res) => {
      const authHeader = `Basic ${Buffer.from(`${API_KEY}:`).toString("base64")}`;
      expect(req.headers.authorization).toEqual(authHeader);
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(getUsersMeResponse()));
    });

    clnt.isAuthenticated().then((result) => {
      expect(result).toBeTruthy();
      done();
    });
  });

  test("should log `connector.auth.success` upon authentication check", (done) => {
    const debugMock = jest.fn().mockImplementation(() => {
      console.log("logger.debug mocked function called");
    });

    const loggerMock = {};
    loggerMock.debug = debugMock.bind(loggerMock);
    clnt.logger = loggerMock;

    mitm.on("request", (req, res) => {
      const authHeader = `Basic ${Buffer.from(`${API_KEY}:`).toString("base64")}`;
      expect(req.headers.authorization).toEqual(authHeader);
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify(getUsersMeResponse()));
    });

    clnt.isAuthenticated().then((result) => {
      expect(result).toBeTruthy();
      expect(debugMock.mock.calls[0][0]).toEqual("connector.auth.success");
      done();
    });
  });

  test("should resolve the Promise with false if authentication fails", (done) => {
    mitm.on("request", (req, res) => {
      res.statusCode = 401;
      res.end();
    });

    clnt.isAuthenticated().then((authResult) => {
      expect(authResult).toBeFalsy();
      done();
    });
  });

  test("should reject the Promise if no api key is configured when checking for authorization", (done) => {
    const clntNoApiKey = new CloseIoClient();

    clntNoApiKey.isAuthenticated().then(() => {
      expect(false).toEqual(true);
      done();
    }, (err) => {
      expect(err).toBeDefined();
      done();
    });
  });

  test("should log `connector.auth.error` if authentication fails", (done) => {
    const errorMock = jest.fn().mockImplementation(() => {
      console.log("logger.error mocked function called");
    });

    const loggerMock = {};
    loggerMock.error = errorMock.bind(loggerMock);
    clnt.logger = loggerMock;

    mitm.on("request", (req, res) => {
      res.statusCode = 401;
      res.end();
    });

    clnt.isAuthenticated().then((authResult) => {
      expect(authResult).toBeFalsy();
      expect(errorMock.mock.calls[0][0]).toEqual("connector.auth.error");
      done();
    });
  });

  test("should retrieve the lead status upon success", (done) => {
    mitm.on("request", (req, res) => {
      const authHeader = `Basic ${Buffer.from(`${API_KEY}:`).toString("base64")}`;
      expect(req.headers.authorization).toEqual(authHeader);
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

  test("should reject the Promise for retrieving lead status if no API key is configured", (done) => {
    const clntNoApiKey = new CloseIoClient(null);

    const debugMock = jest.fn().mockImplementation(() => {
      console.log("logger.debug mocked function called");
    });

    const loggerMock = {};
    loggerMock.debug = debugMock.bind(loggerMock);
    clntNoApiKey.logger = loggerMock;


    clntNoApiKey.getLeadStatuses().then(() => {
      expect(false).toEqual(true);
      done();
    }, (err) => {
      expect(err).toBeDefined();
      expect(debugMock.mock.calls[0][0]).toEqual("connector.auth.notconfigured");
      done();
    });
  });

  test("should reject the Promise to retrieve the lead status upon failure", (done) => {
    mitm.on("request", (req, res) => {
      const authHeader = `Basic ${Buffer.from(`${API_KEY}:`).toString("base64")}`;
      expect(req.headers.authorization).toEqual(authHeader);
      res.statusCode = 500;
      res.end();
    });

    clnt.getLeadStatuses().then(() => {
      expect(false).toEqual(true);
      done();
    }, (err) => {
      expect(err).toBeDefined();
      done();
    });
  });

  test("should create a lead if the data is valid", (done) => {
    const leadData = {
      name: "Bluth Company",
      url: "http://thebluthcompany.tumblr.com/",
      description: "Best. Show. Ever.",
      status_id: "stat_1ZdiZqcSIkoGVnNOyxiEY58eTGQmFNG3LPlEVQ4V7Nk",
      contacts: [
        {
          name: "Gob",
          title: "Sr. Vice President",
          emails: [
            {
              type: "office",
              email: "gob@example.com"
            }
          ],
          phones: [
            {
              type: "office",
              phone: "8004445555"
            }
          ]
        }
      ],
      "custom.lcf_ORxgoOQ5YH1p7lDQzFJ88b4z0j7PLLTRaG66m8bmcKv": "Website contact form",
      "custom.lcf_FSYEbxYJFsnY9tN1OTAPIF33j7Sw5Lb7Eawll7JzoNh": "Segway",
      "custom.lcf_bA7SU4vqaefQLuK5UjZMVpbfHK4SVujTJ9unKCIlTvI": "Real Estate",
      addresses: [
        {
          label: "business",
          address_1: "747 Howard St",
          address_2: "Room 3",
          city: "San Francisco",
          state: "CA",
          zipcode: "94103",
          country: "US",
        }
      ]
    };
    mitm.on("request", (req, res) => {
      const authHeader = `Basic ${Buffer.from(`${API_KEY}:`).toString("base64")}`;
      expect(req.headers.authorization).toEqual(authHeader);
      // TODO: Compare body from IncomingMessage by using the native function
      let body = [];
      req.on("data", (chunk) => {
        body.push(chunk);
      }).on("end", () => {
        body = Buffer.concat(body).toString();
        // at this point, `body` has the entire request body stored in it as a string
        expect(JSON.parse(body)).toEqual(leadData);
        res.statusCode = 200;
        res.end(JSON.stringify(getLeadCreateResponse()));
      });
    });

    clnt.createLead(leadData).then((lead) => {
      const expected = getLeadCreateResponse();
      expect(lead).toEqual(expected);
      done();
    });
  });

  test("should reject the Promise to create a lead if an error occurs", (done) => {
    const leadData = {
      name: "Bluth Company",
      url: "http://thebluthcompany.tumblr.com/",
      description: "Best. Show. Ever.",
      status_id: "stat_1ZdiZqcSIkoGVnNOyxiEY58eTGQmFNG3LPlEVQ4V7Nk",
      contacts: [
        {
          name: "Gob",
          title: "Sr. Vice President",
          emails: [
            {
              type: "office",
              email: "gob@example.com"
            }
          ],
          phones: [
            {
              type: "office",
              phone: "8004445555"
            }
          ]
        }
      ],
      "custom.lcf_ORxgoOQ5YH1p7lDQzFJ88b4z0j7PLLTRaG66m8bmcKv": "Website contact form",
      "custom.lcf_FSYEbxYJFsnY9tN1OTAPIF33j7Sw5Lb7Eawll7JzoNh": "Segway",
      "custom.lcf_bA7SU4vqaefQLuK5UjZMVpbfHK4SVujTJ9unKCIlTvI": "Real Estate",
      addresses: [
        {
          label: "business",
          address_1: "747 Howard St",
          address_2: "Room 3",
          city: "San Francisco",
          state: "CA",
          zipcode: "94103",
          country: "US",
        }
      ]
    };
    mitm.on("request", (req, res) => {
      const authHeader = `Basic ${Buffer.from(`${API_KEY}:`).toString("base64")}`;
      expect(req.headers.authorization).toEqual(authHeader);
      res.statusCode = 500;
      res.end();
    });

    clnt.createLead(leadData).then(() => {
      expect(false).toEqual(true);
      done();
    }, (err) => {
      expect(err).toBeDefined();
      done();
    });
  });

  test("should reject the Promise to create a lead if no API key is configured", (done) => {
    const leadData = {
      name: "Bluth Company",
      url: "http://thebluthcompany.tumblr.com/",
      description: "Best. Show. Ever.",
      status_id: "stat_1ZdiZqcSIkoGVnNOyxiEY58eTGQmFNG3LPlEVQ4V7Nk",
      contacts: [
        {
          name: "Gob",
          title: "Sr. Vice President",
          emails: [
            {
              type: "office",
              email: "gob@example.com"
            }
          ],
          phones: [
            {
              type: "office",
              phone: "8004445555"
            }
          ]
        }
      ],
      "custom.lcf_ORxgoOQ5YH1p7lDQzFJ88b4z0j7PLLTRaG66m8bmcKv": "Website contact form",
      "custom.lcf_FSYEbxYJFsnY9tN1OTAPIF33j7Sw5Lb7Eawll7JzoNh": "Segway",
      "custom.lcf_bA7SU4vqaefQLuK5UjZMVpbfHK4SVujTJ9unKCIlTvI": "Real Estate",
      addresses: [
        {
          label: "business",
          address_1: "747 Howard St",
          address_2: "Room 3",
          city: "San Francisco",
          state: "CA",
          zipcode: "94103",
          country: "US",
        }
      ]
    };
    const debugMock = jest.fn().mockImplementation(() => {
      console.log("logger.debug mocked function called");
    });

    const clntNoApiKey = new CloseIoClient();
    const loggerMock = {};
    loggerMock.debug = debugMock.bind(loggerMock);
    clntNoApiKey.logger = loggerMock;

    mitm.on("request", (req, res) => {
      const authHeader = `Basic ${Buffer.from(`${API_KEY}:`).toString("base64")}`;
      expect(req.headers.authorization).toEqual(authHeader);
      // TODO: Compare body from IncomingMessage by using the native function
      let body = [];
      req.on("data", (chunk) => {
        body.push(chunk);
      }).on("end", () => {
        body = Buffer.concat(body).toString();
        // at this point, `body` has the entire request body stored in it as a string
        expect(JSON.parse(body)).toEqual(leadData);
        res.statusCode = 200;
        res.end(JSON.stringify(getLeadCreateResponse()));
      });
    });

    clntNoApiKey.createLead(leadData).then(() => {
      expect(false).toEqual(true);
      done();
    }, (err) => {
      expect(err).toBeDefined();
      expect(debugMock.mock.calls[0][0]).toEqual("connector.auth.notconfigured");
      done();
    });
  });

  test("should update an existing lead if the data is valid", (done) => {
    const leadData = {
      description: "Best show ever canceled.  Sad."
    };

    const id = "lead_70jZ5hiVt5X31MZ3vJ0R0GJMqJEihkoF7TtSVFbN2ty";

    mitm.on("request", (req, res) => {
      const authHeader = `Basic ${Buffer.from(`${API_KEY}:`).toString("base64")}`;
      expect(req.headers.authorization).toEqual(authHeader);
      expect(req.url).toEqual(`/api/v1/lead/${id}`);
      let body = [];
      req.on("data", (chunk) => {
        body.push(chunk);
      }).on("end", () => {
        body = Buffer.concat(body).toString();
        // at this point, `body` has the entire request body stored in it as a string
        expect(JSON.parse(body)).toEqual(leadData);
        res.statusCode = 200;
        res.end(JSON.stringify(getLeadUpdateResponse()));
      });
    });

    clnt.updateLead(id, leadData).then((lead) => {
      const expected = getLeadUpdateResponse();
      expect(lead).toEqual(expected);
      done();
    });
  });

  test("should reject the Promise to update an existing lead if an error occurs", (done) => {
    const leadData = {
      description: "Best show ever canceled.  Sad."
    };

    const id = "lead_70jZ5hiVt5X31MZ3vJ0R0GJMqJEihkoF7TtSVFbN2ty";

    mitm.on("request", (req, res) => {
      const authHeader = `Basic ${Buffer.from(`${API_KEY}:`).toString("base64")}`;
      expect(req.headers.authorization).toEqual(authHeader);
      expect(req.url).toEqual(`/api/v1/lead/${id}`);
      let body = [];
      req.on("data", (chunk) => {
        body.push(chunk);
      }).on("end", () => {
        body = Buffer.concat(body).toString();
        // at this point, `body` has the entire request body stored in it as a string
        expect(JSON.parse(body)).toEqual(leadData);
        res.statusCode = 500;
        res.end();
      });
    });

    clnt.updateLead(id, leadData).then(() => {
      expect(false).toEqual(true);
      done();
    }, (err) => {
      expect(err).toBeDefined();
      done();
    });
  });

  test("should reject the Promise to update an existing lead if the identifier is less than 5 characters", (done) => {
    const leadData = {
      description: "Best show ever canceled.  Sad."
    };

    const id = "lead";

    clnt.updateLead(id, leadData).then(() => {
      expect(false).toEqual(true);
      done();
    }, (err) => {
      expect(err).toBeDefined();
      done();
    });
  });

  test("should reject the Promise to update an existing lead if no API key is configured", (done) => {
    const leadData = {
      description: "Best show ever canceled.  Sad."
    };

    const id = "lead_70jZ5hiVt5X31MZ3vJ0R0GJMqJEihkoF7TtSVFbN2ty";

    const debugMock = jest.fn().mockImplementation(() => {
      console.log("logger.debug mocked function called");
    });

    const clntNoApiKey = new CloseIoClient();
    const loggerMock = {};
    loggerMock.debug = debugMock.bind(loggerMock);
    clntNoApiKey.logger = loggerMock;

    clntNoApiKey.updateLead(id, leadData).then(() => {
      expect(false).toEqual(true);
      done();
    }, (err) => {
      expect(err).toBeDefined();
      expect(debugMock.mock.calls[0][0]).toEqual("connector.auth.notconfigured");
      done();
    });
  });

  test.only("should list all leads that match the query if the parameters are valid", () => {
    const q = "company: Wayne Enterprises";
    mitm.on("request", (req, res) => {
      const authHeader = `Basic ${Buffer.from(`${API_KEY}:`).toString("base64")}`;
      expect(req.headers.authorization).toEqual(authHeader);
      console.log(">>> Url:", req.url);
      res.statusCode = 200;
      res.end(JSON.stringify(getLeadListResponse()));
    });

    clnt.listLeads(q, ["name", "description"]).then((result) => {
      expect(result.has_more).toEqual(false);
      expect(result.total_results).toEqual(1);
      expect(result.data).toEqual(getLeadListResponse());
    }, (err) => {
      console.log(">>> Error", err);
    });
  });

  test("should reject the Promise to update an existing lead if no API key is configured", (done) => {
    const q = "company: Wayne Enterprises";
    const debugMock = jest.fn().mockImplementation(() => {
      console.log("logger.debug mocked function called");
    });

    const clntNoApiKey = new CloseIoClient();
    const loggerMock = {};
    loggerMock.debug = debugMock.bind(loggerMock);
    clntNoApiKey.logger = loggerMock;

    clntNoApiKey.listLeads(q, ["name", "description"]).then(() => {
      expect(false).toEqual(true);
      done();
    }, (err) => {
      expect(err).toBeDefined();
      expect(debugMock.mock.calls[0][0]).toEqual("connector.auth.notconfigured");
      done();
    });
  });

  afterEach(() => {
    mitm.disable();
  });
});
