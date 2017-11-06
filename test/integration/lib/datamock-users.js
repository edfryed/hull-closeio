/* @flow */

export function getUsersMeResponse(): any {
  return {
    "id": "user_MvDoAZA889UMrgsZbnXmHkJSomSi7qk2Iwc4JnGHTbo",
    "first_name": "Anthony",
    "last_name": "Nemitz",
    "date_created": "2012-08-29T13:46:31.870000+00:00",
    "date_updated": "2013-02-08T06:17:00.583000+00:00",
    "email": "anthony@close.io",
    "image": "https://secure.gravatar.com/avatar/0ff7116c35caeba6d174affd45730cfd",
    "phone": null,
    "last_used_timezone": "America/Denver",
    "memberships": [{
      "user_id": "user_MvDoAZA889UMrgsZbnXmHkJSomSi7qk2Iwc4JnGHTbo",
      "record_calls": false,
      "organization_id": "orga_bwwWG475zqWiQGur0thQshwVXo8rIYecQHDWFanqhen",
      "track_email_opens": true,
      "role_id": "role_y6eLquXvRUdmwqi61tsmgCJUU7uGfxaRbDuLoONZL9p",
      "permissions_granted": ["export", "bulk_edit"],
      "id": "memb_I4Tx9tZwz5npqdGtd0baWtjjlpeFf45OBlkAAKcF3Gc"
    }],
    "organizations": [{
      "name": "Sample Data",
      "lead_statuses": [{
          "id": "stat_1ZdiZqcSIkoGVnNOyxiEY58eTGQmFNG3LPlEVQ4V7Nk",
          "label": "Potential"
        },
        {
          "id": "stat_2ZdiZqcSIkoGVnNOyxiEY58eTGQmFNG3LPlEVQ4V7Nk",
          "label": "Bad Fit"
        },
        {
          "id": "stat_3ZdiZqcSIkoGVnNOyxiEY58eTGQmFNG3LPlEVQ4V7Nk",
          "label": "Qualified"
        }
      ],
      "opportunity_statuses": [{
          "id": "stat_4ZdiZqcSIkoGVnNOyxiEY58eTGQmFNG3LPlEVQ4V7Nk",
          "label": "Active",
          "type": "active"
        },
        {
          "id": "stat_5ZdiZqcSIkoGVnNOyxiEY58eTGQmFNG3LPlEVQ4V7Nk",
          "label": "Won",
          "type": "won"
        },
        {
          "id": "stat_6ZdiZqcSIkoGVnNOyxiEY58eTGQmFNG3LPlEVQ4V7Nk",
          "label": "Lost",
          "type": "lost"
        },
        {
          "id": "stat_7ZdiZqcSIkoGVnNOyxiEY58eTGQmFNG3LPlEVQ4V7Nk",
          "label": "On hold"
          "type": "active"
        }
      ],
      "created_by": null,
      "date_updated": "2013-02-20T04:38:01.961000+00:00",
      "date_created": "2013-02-01T00:54:51.097000+00:00",
      "id": "orga_bwwWG475zqWiQGur0thQshwVXo8rIYecQHDWFanqhen",
      "updated_by": null
    }, ],
    "email_accounts": [{
      "receive_attempts_count": 0,
      "user_id": "user_MvDoAZA889UMrgsZbnXmHkJSomSi7qk2Iwc4JnGHTbo",
      "smtp": {
        "username": "anthony@close.io",
        "use_ssl": true,
        "host": "smtp.gmail.com",
        "port": 465
      },
      "imap": {
        "username": "anthony@close.io",
        "use_ssl": true,
        "host": "imap.gmail.com",
        "port": 993
      },
      "organization_id": "orga_3ZdiZqcSIkoGVnNOyxiEY58eTGQmFNG3LPlEVQ4V7Nk",
      "identities": [],
      "id": "emailacct_qG1RuJuy5baiXvVbIc2VelooJwGcKeIrQLNtTd9p6RO"
    }],
    "phone_numbers": [{
      "date_updated": "2013-02-01T01:09:43.539000+00:00",
      "organization_id": "orga_bwwWG475zqWiQGur0thQshwVXo8rIYecQHDWFanqhen",
      "number": "16502822249",
      "date_created": "2013-02-01T01:09:43.539000+00:00"
    }],
    "sip_user": {
      "username": "kasjfdioashfausfsljdf",
      "date_updated": "2012-08-29T13:46:32.601000+00:00",
      "secret": "ierhunflqwfnqfqfqfq3fq2f",
      "server": "phone.plivo.com",
      "date_created": "2012-08-29T13:46:32.601000+00:00"
    }
  };
}
