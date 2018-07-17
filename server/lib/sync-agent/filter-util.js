/* @flow */
import type { THullUserUpdateMessage, THullUser } from "hull";
import type {
  UserUpdateEnvelope,
  AccountUpdateEnvelope,
  FilterResults
} from "../types";

const _ = require("lodash");

const SHARED_MESSAGES = require("../shared-messages");

class FilterUtil {
  synchronizedAccountSegments: Array<string>;
  accountIdHull: string;

  filterUsers(envelopes: Array<UserUpdateEnvelope>): FilterResults<UserUpdateEnvelope> {
    const results: FilterResults<UserUpdateEnvelope> = {
      toSkip: [],
      toInsert: [],
      toUpdate: []
    };

    envelopes.forEach((envelope: UserUpdateEnvelope) => {
      // Filter out users without lead
      if (_.get(envelope, "contact.lead_id", null) === null) {
        const skipMsg = SHARED_MESSAGES.OPERATION_SKIP_NOLINKEDACCOUNT;
        envelope.skipReason = skipMsg.message;
        envelope.opsResult = "skip";
        return results.toSkip.push(envelope);
      }
      // Filter users not linked to accounts that match whitelisted segments
      if (!this.matchesSynchronizedAccountSegments(envelope, "account_segments")) {
        const skipMsg = SHARED_MESSAGES.OPERATION_SKIP_NOMATCHACCOUNTSEGMENTSUSER();
        envelope.skipReason = skipMsg.message;
        envelope.opsResult = "skip";
        return results.toSkip.push(envelope);
      }

      // Determine which contacts to update or create
      if (_.get(envelope, "contact.id", null) === null) {
        return results.toInsert.push(envelope);
      }

      results.toUpdate.push(envelope);
    });

    return results;
  }

  filterAccounts(envelopes: Array<AccountUpdateEnvelope>): FilterResults<AccountUpdateEnvelope> {
    const results: FilterResults<AccountUpdateEnvelope> = {
      toSkip: [],
      toInsert: [],
      toUpdate: []
    };

    envelopes.forEach((envelope: AccountUpdateEnvelope) => {
      // Filter out all accounts that have no identifier in Hull
      if (_.get(envelope, `account.${this.accountIdHull}`, null) === null) {
        const skipMsg = SHARED_MESSAGES.OPERATION_SKIP_NOACCOUNTIDENT(this.accountIdHull);
        envelope.skipReason = skipMsg.message;
        envelope.opsResult = "skip";
        return results.toSkip.push(envelope);
      }

      // Filter out all accounts that do not match the whitelisted account segments
      if (!this.matchesSynchronizedAccountSegments(envelope, "segments")) {
        const skipMsg = SHARED_MESSAGES.OPERATION_SKIP_NOMATCHACCOUNTSEGMENTS();
        envelope.skipReason = skipMsg.message;
        envelope.opsResult = "skip";
        return results.toSkip.push(envelope);
      }

      // Determine which leads to insert and which ones to update
      if (_.get(envelope, "lead.id", null) === null) {
        return results.toInsert.push(envelope);
      }

      results.toUpdate.push(envelope);
    });

    return results;
  }

  matchesSynchronizedAccountSegments(envelope: UserUpdateEnvelope | AccountUpdateEnvelope, segmentPropertyName: string): boolean {
    const msgSegmentIds: Array<string> = _.get(envelope.message, segmentPropertyName, "segments").map(s => s.id);
    if (_.intersection(msgSegmentIds, this.synchronizedAccountSegments).length > 0) {
      return true;
    }
    return false;
  }
}

module.exports = FilterUtil;
