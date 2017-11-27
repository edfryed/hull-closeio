/* global describe, test, beforeEach, afterEach */
import _ from "lodash";
import nock from "nock";

import { getLeadStatusesReponseBody } from "../helper/datamock-leadstatuses";
import { getUsersMeResponse } from "../helper/datamock-users";
import { getLeadCreateResponse, getLeadUpdateResponse, getLeadListResponse } from "../helper/datamock-leads";
import { getCreateContactResponse, getUpdateContactResponse, getListContactResponse } from "../helper/datamock-contacts";
import { getListCustomFieldsReponseBody } from "../helper/datamock-customfields";

import { CloseIoClient } from "../../server/lib/closeio-client";

describe("CloseIoClient", () => {
  const BASE_URL = "https://app.close.io/api/v1";
  const API_KEY = "abcd12345z";
  let clnt;

  beforeEach(() => {
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
    nock(BASE_URL)
      .get("/me")
      .reply(200, function () { // eslint-disable-line func-names
        const authHeader = `Basic ${Buffer.from(`${API_KEY}:`).toString("base64")}`;
        expect(this.req.headers.authorization).toEqual(authHeader);
        return getUsersMeResponse();
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

    nock(BASE_URL)
      .get("/me")
      .reply(200, function () { // eslint-disable-line func-names
        const authHeader = `Basic ${Buffer.from(`${API_KEY}:`).toString("base64")}`;
        expect(this.req.headers.authorization).toEqual(authHeader);
        return getUsersMeResponse();
      });

    clnt.isAuthenticated().then((result) => {
      expect(result).toBeTruthy();
      expect(debugMock.mock.calls[0][0]).toEqual("connector.auth.success");
      done();
    });
  });

  test("should resolve the Promise with false if authentication fails", (done) => {
    nock(BASE_URL)
      .get("/me")
      .reply(401, {});

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

    nock(BASE_URL)
      .get("/me")
      .reply(401, {});

    clnt.isAuthenticated().then((authResult) => {
      expect(authResult).toBeFalsy();
      expect(errorMock.mock.calls[0][0]).toEqual("connector.auth.error");
      done();
    });
  });

  test("should retrieve the lead status upon success", (done) => {
    nock(BASE_URL)
      .get("/status/lead/")
      .reply(200, function () { // eslint-disable-line func-names
        const authHeader = `Basic ${Buffer.from(`${API_KEY}:`).toString("base64")}`;
        expect(this.req.headers.authorization).toEqual(authHeader);
        return getLeadStatusesReponseBody();
      });

    clnt.getLeadStatuses().then((statuses) => {
      expect(statuses).toHaveLength(4);
      expect(statuses[0].label).toEqual("Potential");
      done();
    });
  });

  test("should reject the Promise for retrieving lead status if no API key is configured", (done) => {
    const clntNoApiKey = new CloseIoClient();

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
    nock(BASE_URL)
      .get("/status/lead/")
      .reply(500, function () { // eslint-disable-line func-names
        const authHeader = `Basic ${Buffer.from(`${API_KEY}:`).toString("base64")}`;
        expect(this.req.headers.authorization).toEqual(authHeader);
        return {};
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
    nock(BASE_URL)
      .post("/lead/")
      .reply(200, function (uri, requestBody) { // eslint-disable-line func-names
        const authHeader = `Basic ${Buffer.from(`${API_KEY}:`).toString("base64")}`;
        expect(this.req.headers.authorization).toEqual(authHeader);
        expect(requestBody).toEqual(leadData);
        return getLeadCreateResponse();
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
    nock(BASE_URL)
      .post("/lead/")
      .reply(500, function () { // eslint-disable-line func-names
        const authHeader = `Basic ${Buffer.from(`${API_KEY}:`).toString("base64")}`;
        expect(this.req.headers.authorization).toEqual(authHeader);
        return {};
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

    nock(BASE_URL)
      .put(`/lead/${id}`)
      .reply(200, function (uri, body) { // eslint-disable-line func-names
        const authHeader = `Basic ${Buffer.from(`${API_KEY}:`).toString("base64")}`;
        expect(this.req.headers.authorization).toEqual(authHeader);
        expect(body).toEqual(leadData);
        return getLeadUpdateResponse();
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

    nock(BASE_URL)
      .put(`/lead/${id}`)
      .reply(500, function (uri, body) { // eslint-disable-line func-names
        const authHeader = `Basic ${Buffer.from(`${API_KEY}:`).toString("base64")}`;
        expect(this.req.headers.authorization).toEqual(authHeader);
        expect(body).toEqual(leadData);
        return {};
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

  test("should list leads that match the query if the parameters are valid", () => {
    const q = "company: Wayne Enterprises";
    const fields = ["name", "description"];
    nock(BASE_URL)
      .get("/lead/")
      .query({
        query: q,
        _fields: fields.join(","),
        _limit: 100,
        _skip: 0
      })
      .reply(200, function () { // eslint-disable-line func-names
        const authHeader = `Basic ${Buffer.from(`${API_KEY}:`).toString("base64")}`;
        expect(this.req.headers.authorization).toEqual(authHeader);
        return getLeadListResponse();
      });

    clnt.listLeads(q, fields).then((result) => {
      if (_.isString(result)) {
        result = JSON.parse(result);
      }
      expect(result.has_more).toEqual(false);
      expect(result.total_results).toEqual(1);
      expect(result.data).toEqual(getLeadListResponse().data);
    }, (err) => {
      console.log(">>> Error", err);
    });
  });

  test("should reject the Promise to list leads if no API key is configured", (done) => {
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

  test("should reject the Promise to list leads if the request fails", (done) => {
    const q = "company: Wayne Enterprises";
    const fields = ["name", "description"];
    nock(BASE_URL)
      .get("/lead/")
      .query({
        query: q,
        _fields: fields.join(","),
        _limit: 100,
        _skip: 0
      })
      .reply(500, {});

    clnt.listLeads(q, ["name", "description"]).then(() => {
      expect(false).toEqual(true);
      done();
    }, (err) => {
      expect(err).toBeDefined();
      done();
    });
  });

  test("should create a contact if the data is valid", (done) => {
    const contactData = {
      lead_id: "lead_QyNaWw4fdSwxl5Mc5daMFf3Y27PpIcH0awPbC9l7uyo",
      name: "John Smith",
      title: "President",
      phones: [
        { phone: "9045551234", type: "mobile" }
      ],
      emails: [
        { email: "john@example.com", type: "office" }
      ],
      urls: [
        { url: "http://twitter.com/google/", type: "url" }
      ]
    };
    nock(BASE_URL)
      .post("/contact/")
      .reply(200, function (uri, requestBody) { // eslint-disable-line func-names
        const authHeader = `Basic ${Buffer.from(`${API_KEY}:`).toString("base64")}`;
        expect(this.req.headers.authorization).toEqual(authHeader);
        expect(requestBody).toEqual(contactData);
        return getCreateContactResponse();
      });

    clnt.createContact(contactData).then((lead) => {
      const expected = getCreateContactResponse();
      expect(lead).toEqual(expected);
      done();
    });
  });

  test("should reject the Promise to create a lead if an error occurs", (done) => {
    const contactData = {
      lead_id: "lead_QyNaWw4fdSwxl5Mc5daMFf3Y27PpIcH0awPbC9l7uyo",
      name: "John Smith",
      title: "President",
      phones: [
        { phone: "9045551234", type: "mobile" }
      ],
      emails: [
        { email: "john@example.com", type: "office" }
      ],
      urls: [
        { url: "http://twitter.com/google/", type: "url" }
      ]
    };
    nock(BASE_URL)
      .post("/contact/")
      .reply(500, function () { // eslint-disable-line func-names
        const authHeader = `Basic ${Buffer.from(`${API_KEY}:`).toString("base64")}`;
        expect(this.req.headers.authorization).toEqual(authHeader);
        return {};
      });

    clnt.createContact(contactData).then(() => {
      expect(false).toEqual(true);
      done();
    }, (err) => {
      expect(err).toBeDefined();
      done();
    });
  });

  test("should reject the Promise to create a contact if no API key is configured", (done) => {
    const contactData = {
      lead_id: "lead_QyNaWw4fdSwxl5Mc5daMFf3Y27PpIcH0awPbC9l7uyo",
      name: "John Smith",
      title: "President",
      phones: [
        { phone: "9045551234", type: "mobile" }
      ],
      emails: [
        { email: "john@example.com", type: "office" }
      ],
      urls: [
        { url: "http://twitter.com/google/", type: "url" }
      ]
    };
    const debugMock = jest.fn().mockImplementation(() => {
      console.log("logger.debug mocked function called");
    });

    const clntNoApiKey = new CloseIoClient();
    const loggerMock = {};
    loggerMock.debug = debugMock.bind(loggerMock);
    clntNoApiKey.logger = loggerMock;

    clntNoApiKey.createContact(contactData).then(() => {
      expect(false).toEqual(true);
      done();
    }, (err) => {
      expect(err).toBeDefined();
      expect(debugMock.mock.calls[0][0]).toEqual("connector.auth.notconfigured");
      done();
    });
  });

  test("should update an existing contact if the data is valid", (done) => {
    const contactData = {
      name: "Johnny Smith",
    };

    const id = "cont_sNIdBgngvbdTTEN1mspKgUqKAWfbul4IITvnWoRw1T7";

    nock(BASE_URL)
      .put(`/contact/${id}`)
      .reply(200, function (uri, body) { // eslint-disable-line func-names
        const authHeader = `Basic ${Buffer.from(`${API_KEY}:`).toString("base64")}`;
        expect(this.req.headers.authorization).toEqual(authHeader);
        expect(body).toEqual(contactData);
        return getUpdateContactResponse();
      });

    clnt.updateContact(id, contactData).then((lead) => {
      const expected = getUpdateContactResponse();
      expect(lead).toEqual(expected);
      done();
    });
  });

  test("should reject the Promise to update an existing contact if an error occurs", (done) => {
    const contactData = {
      name: "Johnny Smith",
    };

    const id = "cont_sNIdBgngvbdTTEN1mspKgUqKAWfbul4IITvnWoRw1T7";

    nock(BASE_URL)
      .put(`/contact/${id}`)
      .reply(500, function (uri, body) { // eslint-disable-line func-names
        const authHeader = `Basic ${Buffer.from(`${API_KEY}:`).toString("base64")}`;
        expect(this.req.headers.authorization).toEqual(authHeader);
        expect(body).toEqual(contactData);
        return {};
      });

    clnt.updateContact(id, contactData).then(() => {
      expect(false).toEqual(true);
      done();
    }, (err) => {
      expect(err).toBeDefined();
      done();
    });
  });

  test("should reject the Promise to update an existing contact if the identifier is less than 5 characters", (done) => {
    const contactData = {
      name: "Johnny Smith",
    };

    const id = "cont";

    clnt.updateContact(id, contactData).then(() => {
      expect(false).toEqual(true);
      done();
    }, (err) => {
      expect(err).toBeDefined();
      done();
    });
  });

  test("should reject the Promise to update an existing contact if no API key is configured", (done) => {
    const contactData = {
      name: "Johnny Smith",
    };

    const id = "cont_sNIdBgngvbdTTEN1mspKgUqKAWfbul4IITvnWoRw1T7";

    const debugMock = jest.fn().mockImplementation(() => {
      console.log("logger.debug mocked function called");
    });

    const clntNoApiKey = new CloseIoClient();
    const loggerMock = {};
    loggerMock.debug = debugMock.bind(loggerMock);
    clntNoApiKey.logger = loggerMock;

    clntNoApiKey.updateContact(id, contactData).then(() => {
      expect(false).toEqual(true);
      done();
    }, (err) => {
      expect(err).toBeDefined();
      expect(debugMock.mock.calls[0][0]).toEqual("connector.auth.notconfigured");
      done();
    });
  });

  test("should list contacts that match the query if the parameters are valid", () => {
    const q = "has: name";
    const fields = ["name", "title"];
    nock(BASE_URL)
      .get("/contact/")
      .query({
        query: q,
        _fields: fields.join(","),
        _limit: 100,
        _skip: 0
      })
      .reply(200, function () { // eslint-disable-line func-names
        const authHeader = `Basic ${Buffer.from(`${API_KEY}:`).toString("base64")}`;
        expect(this.req.headers.authorization).toEqual(authHeader);
        return getListContactResponse();
      });

    clnt.listContacts(q, fields).then((result) => {
      if (_.isString(result)) {
        result = JSON.parse(result);
      }
      expect(result.has_more).toEqual(false);
      expect(result.data).toEqual(getListContactResponse().data);
    }, (err) => {
      console.log(">>> Error", err);
    });
  });

  test("should reject the Promise to list contacts if no API key is configured", (done) => {
    const q = "has: name";
    const debugMock = jest.fn().mockImplementation(() => {
      console.log("logger.debug mocked function called");
    });

    const clntNoApiKey = new CloseIoClient();
    const loggerMock = {};
    loggerMock.debug = debugMock.bind(loggerMock);
    clntNoApiKey.logger = loggerMock;

    clntNoApiKey.listContacts(q, ["name", "title"]).then(() => {
      expect(false).toEqual(true);
      done();
    }, (err) => {
      expect(err).toBeDefined();
      expect(debugMock.mock.calls[0][0]).toEqual("connector.auth.notconfigured");
      done();
    });
  });

  test("should reject the Promise to list contacts if the request fails", (done) => {
    const q = "has: name";
    const fields = ["name", "description"];
    nock(BASE_URL)
      .get("/contact/")
      .query({
        query: q,
        _fields: fields.join(","),
        _limit: 100,
        _skip: 0
      })
      .reply(500, {});

    clnt.listContacts(q, ["name", "title"]).then(() => {
      expect(false).toEqual(true);
      done();
    }, (err) => {
      expect(err).toBeDefined();
      done();
    });
  });

  test("should list leads that match the query if the parameters are valid", () => {
    nock(BASE_URL)
      .get("/custom_fields/lead/")
      .query({
        _limit: 100,
        _skip: 0
      })
      .reply(200, function () { // eslint-disable-line func-names
        const authHeader = `Basic ${Buffer.from(`${API_KEY}:`).toString("base64")}`;
        expect(this.req.headers.authorization).toEqual(authHeader);
        return getListCustomFieldsReponseBody();
      });

    clnt.listCustomFields().then((result) => {
      if (_.isString(result)) {
        result = JSON.parse(result);
      }
      expect(result.has_more).toEqual(false);
      expect(result.data).toEqual(getListCustomFieldsReponseBody().data);
    }, (err) => {
      console.log(">>> Error", err);
    });
  });

  test("should reject the Promise to list leads if no API key is configured", (done) => {
    const debugMock = jest.fn().mockImplementation(() => {
      console.log("logger.debug mocked function called");
    });

    const clntNoApiKey = new CloseIoClient();
    const loggerMock = {};
    loggerMock.debug = debugMock.bind(loggerMock);
    clntNoApiKey.logger = loggerMock;

    clntNoApiKey.listCustomFields().then(() => {
      expect(false).toEqual(true);
      done();
    }, (err) => {
      expect(err).toBeDefined();
      expect(debugMock.mock.calls[0][0]).toEqual("connector.auth.notconfigured");
      done();
    });
  });

  test("should reject the Promise to list custom fields if the request fails", (done) => {
    nock(BASE_URL)
      .get("/custom_fields/lead/")
      .query({
        _limit: 100,
        _skip: 0
      })
      .reply(500, {});

    clnt.listCustomFields().then(() => {
      expect(false).toEqual(true);
      done();
    }, (err) => {
      expect(err).toBeDefined();
      done();
    });
  });
});
