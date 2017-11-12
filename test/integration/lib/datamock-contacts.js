
export function getCreateContactResponse() {
  return {
    id: "cont_sNIdBgngvbdTTEN1mspKgUqKAWfbul4IITvnWoRw1T7",
    organization_id: "orga_bwwWG475zqWiQGur0thQshwVXo8rIYecQHDWFanqhen",
    name: "John Smith",
    title: "President",
    date_updated: "2013-03-07T23:23:21.495000+00:00",
    created_by: "user_04EJPREurd0b3KDozVFqXSRbt2uBjw3QfeYa7ZaGTwI",
    date_created: "2013-03-07T23:23:21.495000+00:00",
    updated_by: "user_04EJPREurd0b3KDozVFqXSRbt2uBjw3QfeYa7ZaGTwI",
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
}

export function getUpdateContactResponse() {
  return {
    id: "cont_sNIdBgngvbdTTEN1mspKgUqKAWfbul4IITvnWoRw1T7",
    organization_id: "orga_bwwWG475zqWiQGur0thQshwVXo8rIYecQHDWFanqhen",
    lead_id: "lead_QyNaWw4fdSwxl5Mc5daMFf3Y27PpIcH0awPbC9l7uyo",
    name: "Johnny Smith",
    title: "President",
    date_updated: "2013-03-08T13:13:21.495000+00:00",
    created_by: "user_04EJPREurd0b3KDozVFqXSRbt2uBjw3QfeYa7ZaGTwI",
    date_created: "2013-03-07T23:23:21.495000+00:00",
    updated_by: "user_04EJPREurd0b3KDozVFqXSRbt2uBjw3QfeYa7ZaGTwI",
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
}

export function getListContactResponse() {
  return {
    has_more: false,
    data: [
      {
        name: "Tobias Fünke",
        title: "Blue Man Group (Understudy)",
        date_updated: "2013-02-06T20:53:09.334000+00:00",
        phones: [],
        created_by: null,
        id: "cont_q4xYmlGhA3060dEl0NDJuHRxPMuVjqLn30AFSzh1fRk",
        organization_id: "orga_bwwWG475zqWiQGur0thQshwVXo8rIYecQHDWFanqhen",
        date_created: "2013-02-01T00:54:51.300000+00:00",
        emails: [
          {
            type: "office",
            email_lower: "tobiasfunke@close.io",
            email: "tobiasfunke@close.io"
          }
        ],
        updated_by: "user_04EJPREurd0b3KDozVFqXSRbt2uBjw3QfeYa7ZaGTwI"
      },
      {
        name: "Bruce Wayne",
        title: "The Dark Knight",
        date_updated: "2013-02-06T20:53:01.954000+00:00",
        phones: [
          {
            phone: "+16503334444",
            phone_formatted: "+1 650-333-4444",
            type: "office"
          }
        ],
        created_by: null,
        id: "cont_o0kP3Nqyq0wxr5DLWIEm8mVr6ZpI0AhonKLDG0V5Qjh",
        organization_id: "orga_bwwWG475zqWiQGur0thQshwVXo8rIYecQHDWFanqhen",
        date_created: "2013-02-01T00:54:51.331000+00:00",
        emails: [
          {
            type: "office",
            email_lower: "thedarkknight@close.io",
            email: "thedarkknight@close.io"
          }
        ],
        updated_by: "user_04EJPREurd0b3KDozVFqXSRbt2uBjw3QfeYa7ZaGTwI"
      },
      {
        name: "Gob Bluth",
        title: "Magician",
        date_updated: "2013-02-06T20:48:55.240000+00:00",
        phones: [],
        created_by: null,
        id: "cont_E7dYM0ecRoFQosxiPFz8IxazhN4k11uW8Sh1UsXjNjo",
        organization_id: "orga_bwwWG475zqWiQGur0thQshwVXo8rIYecQHDWFanqhen",
        date_created: "2013-02-01T00:54:51.298000+00:00",
        emails: [
          {
            type: "office",
            email_lower: "bluth@close.io",
            email: "bluth@close.io"
          }
        ],
        updated_by: "user_04EJPREurd0b3KDozVFqXSRbt2uBjw3QfeYa7ZaGTwI"
      },
      {
        name: "Close.io Support",
        title: null,
        date_updated: "2013-02-01T00:59:33.689000+00:00",
        phones: [
          {
            phone: "+18552567346",
            phone_formatted: "+1 855-256-7346",
            type: "office"
          }
        ],
        created_by: null,
        id: "cont_uw6ONU4iBcQg4TyqOKAwl0F1amULG9ZZsY57kHHdJNE",
        organization_id: "orga_bwwWG475zqWiQGur0thQshwVXo8rIYecQHDWFanqhen",
        date_created: "2013-02-01T00:54:51.203000+00:00",
        emails: [
          {
            type: "office",
            email_lower: "support@close.io",
            email: "support@close.io"
          }
        ],
        updated_by: "user_04EJPREurd0b3KDozVFqXSRbt2uBjw3QfeYa7ZaGTwI"
      },
      {
        name: "phil",
        title: "",
        date_updated: "2013-02-08T05:02:39.552000+00:00",
        phones: [],
        created_by: "user_04EJPREurd0b3KDozVFqXSRbt2uBjw3QfeYa7ZaGTwI",
        id: "cont_eXZwc2SVL4G3xSR85jnfPny2ykvoAQndSyi1Doa2YLO",
        organization_id: "orga_bwwWG475zqWiQGur0thQshwVXo8rIYecQHDWFanqhen",
        date_created: "2013-02-08T05:02:39.552000+00:00",
        emails: [
          {
            type: "office",
            email_lower: "phil@close.io",
            email: "phil@close.io"
          }
        ],
        updated_by: "user_04EJPREurd0b3KDozVFqXSRbt2uBjw3QfeYa7ZaGTwI"
      },
      {
        name: "Gob",
        title: "sr. vice president",
        date_updated: "2013-02-20T05:44:14.700000+00:00",
        phones: [
          {
            phone: "+18004445555",
            phone_formatted: "+1 800-444-5555",
            type: "office"
          }
        ],
        created_by: "user_MvDoAZA889UMrgsZbnXmHkJSomSi7qk2Iwc4JnGHTbo",
        id: "cont_qpjDKxbN3WWsuhaJjg2Qr9pkqHqe1yviZ5BS0dEyz05",
        organization_id: "orga_bwwWG475zqWiQGur0thQshwVXo8rIYecQHDWFanqhen",
        date_created: "2013-02-20T05:30:24.844000+00:00",
        emails: [
          {
            type: "office",
            email_lower: "gob@example.com",
            email: "gob@example.com"
          }
        ],
        updated_by: "user_MvDoAZA889UMrgsZbnXmHkJSomSi7qk2Iwc4JnGHTbo"
      },
      {
        name: "Gob",
        title: "sr. vice president",
        date_updated: "2013-02-20T05:44:31.929000+00:00",
        phones: [
          {
            phone: "+18004445555",
            phone_formatted: "+1 800-444-5555",
            type: "office"
          }
        ],
        created_by: "user_MvDoAZA889UMrgsZbnXmHkJSomSi7qk2Iwc4JnGHTbo",
        id: "cont_kfaRMPzwQ9yAOn96gVGUxKRKqsYv6QJStoLhlDEpquY",
        organization_id: "orga_bwwWG475zqWiQGur0thQshwVXo8rIYecQHDWFanqhen",
        date_created: "2013-02-20T05:44:31.929000+00:00",
        emails: [
          {
            type: "office",
            email_lower: "gob@example.com",
            email: "gob@example.com"
          }
        ],
        updated_by: "user_MvDoAZA889UMrgsZbnXmHkJSomSi7qk2Iwc4JnGHTbo"
      },
      {
        name: "Gob",
        title: "sr. vice president",
        date_updated: "2013-02-20T05:44:35.625000+00:00",
        phones: [
          {
            phone: "+18004445555",
            phone_formatted: "+1 800-444-5555",
            type: "office"
          }
        ],
        created_by: "user_MvDoAZA889UMrgsZbnXmHkJSomSi7qk2Iwc4JnGHTbo",
        id: "cont_3lUrUYmceYjzeqrIqF5jpSppZemyxvgquE8Oq1kM6p0",
        organization_id: "orga_bwwWG475zqWiQGur0thQshwVXo8rIYecQHDWFanqhen",
        date_created: "2013-02-20T05:44:35.625000+00:00",
        emails: [
          {
            type: "office",
            email_lower: "gob@example.com",
            email: "gob@example.com"
          }
        ],
        updated_by: "user_MvDoAZA889UMrgsZbnXmHkJSomSi7qk2Iwc4JnGHTbo"
      }
    ]
  };
}

export default { getCreateContactResponse, getUpdateContactResponse };
