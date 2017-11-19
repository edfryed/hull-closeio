/* @flow */

/**
 * Sample response for List lead statuses for your organization.
 * API: GET /status/lead/
 * https://developer.close.io/#lead-statuses-list-lead-statuses-for-your-organization
 *
 * @export
 * @returns {*} An object that is the success response body.
 */
export function getLeadStatusesReponseBody(): any {
  return {
    has_more: false,
    data: [
      {
        id: "stat_1ZdiZqcSIkoGVnNOyxiEY58eTGQmFNG3LPlEVQ4V7Nk",
        label: "Potential"
      },
      {
        id: "stat_2ZdiZqcSIkoGVnNOyxiEY58eTGQmFNG3LPlEVQ4V7Nk",
        label: "Bad Fit"
      },
      {
        id: "stat_3ZdiZqcSIkoGVnNOyxiEY58eTGQmFNG3LPlEVQ4V7Nk",
        label: "Qualified"
      },
      {
        id: "stat_8ZdiZqcSIkoGVnNOyxiEY58eTGQmFNG3LPlEVQ4V7Nk",
        label: "Not Serious"
      }
    ]
  };
}

export default { getLeadStatusesReponseBody };
