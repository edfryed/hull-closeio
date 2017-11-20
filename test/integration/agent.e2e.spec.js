/* global describe, test, expect */
import Promise from "bluebird";
import _ from "lodash";
import { DateTime } from "luxon";

import { Agent, calculateUpdatedSinceTimestamp, composeUpdatedAfterQuery } from "../../server/lib/agent";
import { ShipMock } from "../helper/shipmock";
import { HullClientMock } from "../helper/hullclientmock";
import { MetricsClientMock } from "../helper/metricsclientmock";
import { getLeadStatusesReponseBody } from "../helper/datamock-leadstatuses";
import { getLeadListResponse, getLeadListResponseForPagination } from "../helper/datamock-leads";

describe("Agent", () => {
  const private_settings = {
    synchronized_segments: ["Users w/ Accounts", "SF Leads to sync"],
    lead_status: "stat_1ZdiZqcSIkoGVnNOyxiEY58eTGQmFNG3LPlEVQ4V7Nk",
    api_key: "12345AbcD6"
  };
  const connectorMock = new ShipMock("1234", {}, private_settings);
  const hullClientMock = new HullClientMock();
  const metricsClientMock = new MetricsClientMock();

  test("should get synchronizedSegments from private_settings.synchronized_segments", () => {
    const agent = new Agent(hullClientMock, connectorMock, metricsClientMock);

    expect(agent.synchronizedSegments).toEqual(private_settings.synchronized_segments);
  });

  test("should get leadStatusForCreate from private_settings.lead_status", () => {
    const agent = new Agent(hullClientMock, connectorMock, metricsClientMock);

    expect(agent.leadStatusForCreate).toEqual(private_settings.lead_status);
  });

  test("should set hullClient from injected object", () => {
    const agent = new Agent(hullClientMock, connectorMock, metricsClientMock);

    expect(agent.hullClient).toEqual(hullClientMock);
  });

  test("should set metricClient from injected object", () => {
    const agent = new Agent(hullClientMock, connectorMock, metricsClientMock);

    expect(agent.metricClient).toEqual(metricsClientMock);
  });

  test("should instantiate a new CloseIoClient with the api key from private_settings.api_key", () => {
    const agent = new Agent(hullClientMock, connectorMock, metricsClientMock);

    expect(agent.closeClient.apiKey).toEqual(private_settings.api_key);
  });

  test("shhould detect if the client is potentially authenticated", () => {
    const agent = new Agent(hullClientMock, connectorMock, metricsClientMock);
    expect(agent.isAuthenticationConfigured()).toEqual(true);
  });

  test("should fetch the lead statuses from the client", (done) => {
    const closeClientMock = {};
    const getLeadStatusesMock = jest.fn().mockImplementation(() => {
      return Promise.resolve(getLeadStatusesReponseBody().data);
    });
    closeClientMock.getLeadStatuses = getLeadStatusesMock.bind(closeClientMock);

    const agent = new Agent(hullClientMock, connectorMock, metricsClientMock);
    agent.closeClient = closeClientMock;
    agent.fetchLeadStatuses().then((res) => {
      const statuses = getLeadStatusesReponseBody().data;
      expect(res).toEqual(statuses);
      expect(getLeadStatusesMock.mock.calls.length).toEqual(1);
      done();
    });
  });

  test("should fetch updated leads from the client", (done) => {
    const closeClientMock = {};
    const listLeadsMock = jest.fn().mockImplementation(() => {
      return Promise.resolve(getLeadListResponse());
    });
    closeClientMock.listLeads = listLeadsMock.bind(closeClientMock);

    const agent = new Agent(hullClientMock, connectorMock, metricsClientMock);
    agent.closeClient = closeClientMock;

    const dt = DateTime.local();
    const q = `updated > ${dt.minus({ days: 1 }).toISODate()}`;
    agent.connector.private_settings.last_sync_at = `${dt.valueOf()}`;

    agent.fetchUpdatedLeads().then((res) => {
      expect(res).toEqual(getLeadListResponse().data);
      expect(listLeadsMock.mock.calls[0][0]).toEqual(q);
      expect(listLeadsMock.mock.calls[0][1]).toEqual(["name", "url"]);
      expect(listLeadsMock.mock.calls[0][2]).toEqual(100);
      expect(listLeadsMock.mock.calls[0][3]).toEqual(0);
      expect(listLeadsMock.mock.calls.length).toEqual(1);
      done();
    });
  });

  test("should fetch updated leads from the client with pagination", (done) => {
    const closeClientMock = {};
    const listLeadsMock = jest.fn().mockImplementation((q, f, size, skip) => {
      return Promise.resolve(getLeadListResponseForPagination(skip, size, 200));
    });
    closeClientMock.listLeads = listLeadsMock.bind(closeClientMock);

    const agent = new Agent(hullClientMock, connectorMock, metricsClientMock);
    agent.closeClient = closeClientMock;

    const dt = DateTime.local();
    const q = `updated > ${dt.minus({ days: 1 }).toISODate()}`;
    agent.connector.private_settings.last_sync_at = `${dt.valueOf()}`;

    let expectedLeads = [];
    expectedLeads.push(getLeadListResponseForPagination(0, 100, 200).data);
    expectedLeads.push(getLeadListResponseForPagination(1, 100, 200).data);
    expectedLeads = _.flatten(expectedLeads);

    agent.fetchUpdatedLeads().then((res) => {
      expect(res).toEqual(expectedLeads);
      expect(listLeadsMock.mock.calls[0][0]).toEqual(q);
      expect(listLeadsMock.mock.calls[0][1]).toEqual(["name", "url"]);
      expect(listLeadsMock.mock.calls[0][2]).toEqual(100);
      expect(listLeadsMock.mock.calls[0][3]).toEqual(0);
      expect(listLeadsMock.mock.calls[1][0]).toEqual(q);
      expect(listLeadsMock.mock.calls[1][1]).toEqual(["name", "url"]);
      expect(listLeadsMock.mock.calls[1][2]).toEqual(100);
      expect(listLeadsMock.mock.calls[1][3]).toEqual(1);
      expect(listLeadsMock.mock.calls.length).toEqual(2);
      done();
    });
  });
});

describe("calculateUpdatedSinceTimestamp", () => {
  const lastSync = new Date();
  const connectorMock = new ShipMock("1234", {}, { last_sync_at: lastSync.getTime() });
  const nowUnix = new Date().getTime();

  test("should calculate the proper timestamp with the safety interval", () => {
    const expected = new Date(lastSync.getTime() - 5000);
    const actual = calculateUpdatedSinceTimestamp(connectorMock, 5000, nowUnix);
    expect(actual).toEqual(expected);
  });

  test("should default to 2 days from now if connector doesn't have last_sync_at in the private_settings", () => {
    const connectorMockNoDate = new ShipMock("1234", {}, {});
    const expected = new Date(nowUnix - (1000 * 60 * 60 * 60 * 48) - 5000);
    const actual = calculateUpdatedSinceTimestamp(connectorMockNoDate, 5000, nowUnix);
    expect(actual).toEqual(expected);
  });
});


describe("composeUpdatedAfterQuery", () => {
  test("should take the day before the last sync to compose they query string", () => {
    const lastSync = new Date(2017, 10, 5, 10, 0, 5);
    const expected = "updated > 2017-11-04";
    const actual = composeUpdatedAfterQuery(lastSync);
    expect(actual).toEqual(expected);
  });
});
