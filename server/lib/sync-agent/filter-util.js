/* @flow */
// import type { THullUserUpdateMessage, THullUser } from "hull";
import type {
  UserUpdateEnvelope,
  AccountUpdateEnvelope,
  FilterResults,
  FilterUtilConfiguration
} from "../types";

const _ = require("lodash");

const SHARED_MESSAGES = require("../shared-messages");

class FilterUtil {
  /**
   * Gets or sets the synchronized account segments.
   *
   * @type {Array<string>}
   * @memberof FilterUtil
   */
  synchronizedAccountSegments: Array<string>;

  /**
   * Gets or sets the identifier attribute of the hull account.
   *
   * @type {string}
   * @memberof FilterUtil
   */
  leadIdentifierHull: string;

  /**
   *Creates an instance of FilterUtil.
   * @param {FilterUtilConfiguration} config The settings to configure the util with.
   * @memberof FilterUtil
   */
  constructor(config: FilterUtilConfiguration) {
    // Configure the util with sensible defaults
    this.synchronizedAccountSegments = config.synchronizedAccountSegments || [];
    this.leadIdentifierHull = config.leadIdentifierHull || "domain";
  }

  /**
   * Filters the list of user envelopes to determine the operation.
   *
   * @param {Array<UserUpdateEnvelope>} envelopes The list of envelopes to filter.
   * @returns {FilterResults<UserUpdateEnvelope>} The filter result.
   * @memberof FilterUtil
   */
  filterUsers(
    envelopes: Array<UserUpdateEnvelope>
  ): FilterResults<UserUpdateEnvelope> {
    const results: FilterResults<UserUpdateEnvelope> = {
      toSkip: [],
      toInsert: [],
      toUpdate: []
    };

    envelopes.forEach((envelope: UserUpdateEnvelope) => {
      // Filter out users without lead
      if (
        envelope.cioContactWrite.lead_id === undefined ||
        envelope.cioContactWrite.lead_id === null
      ) {
        const skipMsg = SHARED_MESSAGES.OPERATION_SKIP_NOLINKEDACCOUNT();
        envelope.skipReason = skipMsg.message;
        envelope.opsResult = "skip";
        return results.toSkip.push(envelope);
      }
      // Filter users not linked to accounts that match whitelisted segments
      if (
        !this.matchesSynchronizedAccountSegments(
          envelope,
          "message.account_segments"
        )
      ) {
        const skipMsg = SHARED_MESSAGES.OPERATION_SKIP_NOMATCHACCOUNTSEGMENTSUSER();
        envelope.skipReason = skipMsg.message;
        envelope.opsResult = "skip";
        return results.toSkip.push(envelope);
      }

      // Determine which contacts to update or create
      if (_.get(envelope, "cioContactWrite.id", null) === null) {
        return results.toInsert.push(envelope);
      }

      return results.toUpdate.push(envelope);
    });
    return results;
  }

  /**
   * Filters the list of account envelopes to determine the appropriate operation.
   *
   * @param {Array<AccountUpdateEnvelope>} envelopes The list of envelopes to filter.
   * @returns {FilterResults<AccountUpdateEnvelope>} The filter result.
   * @memberof FilterUtil
   */
  filterAccounts(
    envelopes: Array<AccountUpdateEnvelope>
  ): FilterResults<AccountUpdateEnvelope> {
    const results: FilterResults<AccountUpdateEnvelope> = {
      toSkip: [],
      toInsert: [],
      toUpdate: []
    };

    envelopes.forEach((envelope: AccountUpdateEnvelope) => {
      // Filter out all accounts that have no identifier in Hull
      if (
        envelope.hullAccount[this.leadIdentifierHull] === undefined ||
        envelope.hullAccount[this.leadIdentifierHull] === null
      ) {
        const skipMsg = SHARED_MESSAGES.OPERATION_SKIP_NOLEADIDENT(
          this.leadIdentifierHull
        );
        envelope.skipReason = skipMsg.message;
        envelope.opsResult = "skip";
        return results.toSkip.push(envelope);
      }

      // Filter out all accounts that do not match the whitelisted account segments
      if (
        !this.matchesSynchronizedAccountSegments(
          envelope,
          "message.account_segments"
        )
      ) {
        const skipMsg = SHARED_MESSAGES.OPERATION_SKIP_NOMATCHACCOUNTSEGMENTS();
        envelope.skipReason = skipMsg.message;
        envelope.opsResult = "skip";
        return results.toSkip.push(envelope);
      }

      // Determine which leads to insert and which ones to update
      if (_.get(envelope, "cioLeadWrite.id", null) === null) {
        return results.toInsert.push(envelope);
      }

      return results.toUpdate.push(envelope);
    });
    return results;
  }

  /**
   * Checks whether an envelope matches the synchronized account segments or not.
   *
   * @param {(UserUpdateEnvelope | AccountUpdateEnvelope)} envelope The user or account envelope to check.
   * @param {string} segmentPropertyName The name of the segments property of the message.
   * @returns {boolean} True if the envelope matches; otherwise false.
   * @memberof FilterUtil
   */
  matchesSynchronizedAccountSegments(
    envelope: UserUpdateEnvelope | AccountUpdateEnvelope,
    segmentPropertyName: string = "message.segments"
  ): boolean {
    const msgSegmentIds: Array<string> = _.get(
      envelope,
      segmentPropertyName,
      []
    ).map(s => s.id);
    if (
      _.intersection(msgSegmentIds, this.synchronizedAccountSegments).length > 0
    ) {
      return true;
    }
    return false;
  }
}

module.exports = FilterUtil;
