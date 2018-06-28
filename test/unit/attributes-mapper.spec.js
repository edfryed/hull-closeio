/* global describe, test, expect */
const _ = require("lodash");

const AttributesMapper = require("../../server/lib/utils/attributes-mapper");
const { getListCustomFieldsReponseBody } = require("../helper/datamock-customfields");
const { getLeadCreateResponse } = require("../helper/datamock-leads");
const { getCreateContactResponse } = require("../helper/datamock-contacts");

describe("AttributesMapper", () => {
  const CONNECTOR_SETTINGS = {
    lead_attributes_outbound: [
      {
        hull_field_name: "domain",
        closeio_field_name: "url"
      },
      {
        hull_field_name: "name",
        closeio_field_name: "name"
      }
    ],
    contact_attributes_outbound: [
      { hull_field_name: "name", closeio_field_name: "name" },
      { hull_field_name: "traits_title", closeio_field_name: "title" },
      { hull_field_name: "email", closeio_field_name: "emails.office" }
    ],
    lead_attributes_inbound: [
      "url", "name", "custom.lcf_bA7SU4vqaefQLuK5UjZMVpbfHK4SVujTJ9unKCIlTvI", "addresses"
    ],
    contact_attributes_inbound: [
      "name", "title", "emails"
    ]
  };

  test("should initialize outbound mappings", () => {
    const customFields = getListCustomFieldsReponseBody().data;
    const mapper = new AttributesMapper(CONNECTOR_SETTINGS, customFields);
    const expectedMappings = {
      Lead: CONNECTOR_SETTINGS.lead_attributes_outbound,
      Contact: CONNECTOR_SETTINGS.contact_attributes_outbound
    };
    expect(mapper.mappingsOutbound).toEqual(expectedMappings);
  });

  test("should initialize inbound mappings", () => {
    const customFields = getListCustomFieldsReponseBody().data;
    const mapper = new AttributesMapper(CONNECTOR_SETTINGS, customFields);
    const expectedMappings = {
      Lead: CONNECTOR_SETTINGS.lead_attributes_inbound,
      Contact: CONNECTOR_SETTINGS.contact_attributes_inbound
    };
    expect(mapper.mappingsInbound).toEqual(expectedMappings);
  });

  test("should initialize custom fields", () => {
    const customFields = getListCustomFieldsReponseBody().data;
    const mapper = new AttributesMapper(CONNECTOR_SETTINGS, customFields);
    expect(mapper.customFields).toEqual(customFields);
  });

  test("should not change the name of a human readable field", () => {
    const customFields = getListCustomFieldsReponseBody().data;
    const mapper = new AttributesMapper(CONNECTOR_SETTINGS, customFields);
    const actual = mapper.getHumanFieldName("name");
    expect(actual).toEqual("name");
  });

  test("should return the name of a custom field", () => {
    const customFields = _.map(getListCustomFieldsReponseBody().data, (f) => {
      f.id = `custom.${f.id}`;
      return f;
    });
    const mapper = new AttributesMapper(CONNECTOR_SETTINGS, customFields);
    const actual = mapper.getHumanFieldName("custom.lcf_xUDvptVqoPQYv5tmRFDxemYOWFT9nlLRqJyQhpcNh4z");
    expect(actual).toEqual("language_preference");
  });

  test("should map a hull object to a lead", () => {
    const hullUser = {
      account: {
        created_at: "2017-10-25T10:06:00Z",
        domain: "hullsfdc.io",
        employees: 2,
        external_id: "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
        industry: "Technology",
        name: "Hull SFDC Testing",
        plan: "Enterprise",
        _sales_business_won: "2017-10-25T12:45:00Z"
      },
      id: "59f06a5f421a978e920643d7",
      created_at: "2017-10-25T10:41:35Z",
      is_approved: false,
      has_password: false,
      accepts_marketing: false,
      email: "sven+sfdc4@hull.io",
      domain: "hull.io",
      name: "Sven4 SFDC",
      last_name: "SFDC",
      first_name: "Svn4",
      traits_status: "Lead",
      "traits_intercom/citygroup": "Stuttgart",
      traits_company: "Hull Test SFDC GmbH & Co KG",
      "traits_salesforce_lead/id": "abcdf",
      "traits_salesforce_contact/id": "1234foo",
      "traits_salesforce/id": "56789baz"
    };

    const expectedCloseObject = {
      name: hullUser.account.name,
      url: hullUser.account.domain,
      contacts: [
        {
          name: hullUser.name,
          emails: [
            { email: hullUser.email, type: "office" }
          ]
        }
      ]
    };

    const customFields = getListCustomFieldsReponseBody().data;
    const mapper = new AttributesMapper(CONNECTOR_SETTINGS, customFields);
    const actual = mapper.mapToServiceObject("Lead", hullUser);

    expect(actual).toEqual(expectedCloseObject);
  });

  test("should map a hull object to a contact", () => {
    const hullUser = {
      account: {
        created_at: "2017-10-25T10:06:00Z",
        domain: "hullsfdc.io",
        employees: 2,
        external_id: "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
        industry: "Technology",
        name: "Hull SFDC Testing",
        plan: "Enterprise",
        _sales_business_won: "2017-10-25T12:45:00Z",
        "closeio/id": "lead_70jZ5hiVt5X31MZ3vJ0R0GJMqJEihkoF7TtSVFbN2ty"
      },
      id: "59f06a5f421a978e920643d7",
      created_at: "2017-10-25T10:41:35Z",
      is_approved: false,
      has_password: false,
      accepts_marketing: false,
      email: "sven+sfdc4@hull.io",
      domain: "hull.io",
      name: "Sven4 SFDC",
      last_name: "SFDC",
      first_name: "Svn4",
      traits_status: "Lead",
      "traits_intercom/citygroup": "Stuttgart",
      traits_company: "Hull Test SFDC GmbH & Co KG",
      "traits_salesforce_lead/id": "abcdf",
      "traits_salesforce_contact/id": "1234foo",
      "traits_salesforce/id": "56789baz"
    };

    const expectedCloseObject = {
      name: hullUser.name,
      emails: [
        { email: hullUser.email, type: "office" }
      ],
      lead_id: hullUser.account["closeio/id"]
    };

    const customFields = getListCustomFieldsReponseBody().data;
    const mapper = new AttributesMapper(CONNECTOR_SETTINGS, customFields);
    const actual = mapper.mapToServiceObject("Contact", hullUser);

    expect(actual).toEqual(expectedCloseObject);
  });

  test("should map a hull object to a lead with status", () => {
    const hullUser = {
      account: {
        created_at: "2017-10-25T10:06:00Z",
        domain: "hullsfdc.io",
        employees: 2,
        external_id: "a9461ad518be40ba-b568-4729-a676-f9c55abd72c9",
        industry: "Technology",
        name: "Hull SFDC Testing",
        plan: "Enterprise",
        _sales_business_won: "2017-10-25T12:45:00Z"
      },
      id: "59f06a5f421a978e920643d7",
      created_at: "2017-10-25T10:41:35Z",
      is_approved: false,
      has_password: false,
      accepts_marketing: false,
      email: "sven+sfdc4@hull.io",
      domain: "hull.io",
      name: "Sven4 SFDC",
      last_name: "SFDC",
      first_name: "Svn4",
      traits_status: "Lead",
      "traits_intercom/citygroup": "Stuttgart",
      traits_company: "Hull Test SFDC GmbH & Co KG",
      "traits_salesforce_lead/id": "abcdf",
      "traits_salesforce_contact/id": "1234foo",
      "traits_salesforce/id": "56789baz"
    };

    const expectedCloseObject = {
      name: hullUser.account.name,
      url: hullUser.account.domain,
      contacts: [
        {
          name: hullUser.name,
          emails: [
            { email: hullUser.email, type: "office" }
          ]
        }
      ],
      status_id: "stat_6e5tChl9r4eyXWnKoCvMWClBsbcPuORMya1FEMtJoCl"
    };

    const leadStatusSettings = _.merge({ lead_status: "stat_6e5tChl9r4eyXWnKoCvMWClBsbcPuORMya1FEMtJoCl" }, CONNECTOR_SETTINGS);

    const customFields = getListCustomFieldsReponseBody().data;
    const mapper = new AttributesMapper(leadStatusSettings, customFields);
    const actual = mapper.mapToServiceObject("Lead", hullUser);

    expect(actual).toEqual(expectedCloseObject);
  });

  test("should map a lead to a Hull traits object", () => {
    const sObject = getLeadCreateResponse();

    const expectedTraitsObject = {
      "closeio/url": { value: sObject.url },
      "closeio/id": { value: sObject.id },
      "closeio/name": { value: sObject.name },
      "closeio/created_at": { value: sObject.date_created, operation: "setIfNull" },
      "closeio/updated_at": { value: sObject.date_updated },
      domain: { value: sObject.url, operation: "setIfNull" },
      "closeio/address_office_address_1": { value: sObject.addresses[0].address_1 },
      "closeio/address_office_address_2": { value: sObject.addresses[0].address_2 },
      "closeio/address_office_city": { value: sObject.addresses[0].city },
      "closeio/address_office_country": { value: sObject.addresses[0].country },
      "closeio/address_office_state": { value: sObject.addresses[0].state },
      "closeio/address_office_zipcode": { value: sObject.addresses[0].zipcode },
      "closeio/sub_industry": { value: "Real Estate" }
    };

    const customFields = _.map(getListCustomFieldsReponseBody().data, (f) => {
      f.id = `custom.${f.id}`;
      return f;
    });

    const mapper = new AttributesMapper(CONNECTOR_SETTINGS, customFields);
    const actual = mapper.mapToHullAttributeObject("Lead", sObject);

    expect(actual).toEqual(expectedTraitsObject);
  });

  test("should map a lead to a Hull ident object", () => {
    const sObject = getLeadCreateResponse();

    const expectedIdentObject = {
      domain: "thebluthcompany.tumblr.com"
    };

    const customFields = getListCustomFieldsReponseBody().data;
    const mapper = new AttributesMapper(CONNECTOR_SETTINGS, customFields);
    const actual = mapper.mapToHullIdentObject("Lead", sObject);

    expect(actual).toEqual(expectedIdentObject);
  });

  test("should map a contact to a Hull ident object", () => {
    const sObject = getCreateContactResponse();

    const expectedTraitsObject = {
      "closeio/name": { value: sObject.name },
      "closeio/title": { value: sObject.title },
      "closeio/id": { value: sObject.id },
      "closeio/email_office": { value: sObject.emails[0].email },
      "closeio/lead_id": { value: sObject.lead_id }
    };

    const customFields = getListCustomFieldsReponseBody().data;
    const mapper = new AttributesMapper(CONNECTOR_SETTINGS, customFields);
    const actual = mapper.mapToHullAttributeObject("Contact", sObject);

    expect(actual).toEqual(expectedTraitsObject);
  });

  test("should map a contact to a Hull ident object", () => {
    const sObject = getCreateContactResponse();

    const expectedIdentObject = {
      anonymous_id: `closeio:${sObject.id}`,
      email: "john@example.com"
    };

    const customFields = getListCustomFieldsReponseBody().data;
    const mapper = new AttributesMapper(CONNECTOR_SETTINGS, customFields);
    const actual = mapper.mapToHullIdentObject("Contact", sObject);

    expect(actual).toEqual(expectedIdentObject);
  });
});
