/* @flow */
import { IFilterResult, IUserUpdateEnvelope, IFilterUtil } from "../shared";

const _ = require("lodash");

class FilterResult implements IFilterResult {
  toInsert: Array<IUserUpdateEnvelope>;
  toUpdate: Array<IUserUpdateEnvelope>;
  toSkip: Array<IUserUpdateEnvelope>;

  constructor() {
    this.toInsert = [];
    this.toUpdate = [];
    this.toSkip = [];
  }
}

class FilterUtil implements IFilterUtil {
  synchronizedSegments: Array<string>;

  constructor(settings: Object) {
    this.synchronizedSegments = _.get(settings, "synchronized_segments", []);
  }

  filterAccounts(envelopes: Array<IUserUpdateEnvelope>): IFilterResult {
    const results: IFilterResult = new FilterResult();

    envelopes.forEach((envelope) => {
      if (this.matchesWhitelistedSegments(envelope)) {
        if (_.has(envelope.message, "account.closeio/id")) {
          return results.toUpdate.push(envelope);
        }
        return results.toInsert.push(envelope);
      }

      envelope.skipReason = "Account doesn't belong to synchronized segments.";
      return results.toSkip.push(envelope);
    });

    return results;
  }

  /**
   * Filters users that have either a valid close.io contact id
   * or that belong to an account with a valid close.io lead id.
   *
   * @param {Array<IUserUpdateEnvelope>} envelopes The envelopes to filter.
   * @returns {IFilterResult} A filter result that determines which users to insert, update or skip.
   * @memberof FilterUtil
   */
  filterUsers(envelopes: Array<IUserUpdateEnvelope>): IFilterResult {
    const results: IFilterResult = new FilterResult();

    envelopes.forEach((envelope) => {
      if (this.matchesWhitelistedSegments(envelope)) {
        if (_.has(envelope.message, "account.closeio/id")) {
          if (_.has(envelope.message, "user.traits_closeio/id")) {
            return results.toUpdate.push(envelope);
          }
          return results.toInsert.push(envelope);
        }
        envelope.skipReason = "User not associated with account. Cannot create contact without lead in close.io";
        return results.toSkip.push(envelope);
      }

      envelope.skipReason = "User doesn't belong to synchronized segments";
      return results.toSkip.push(envelope);
    });

    return results;
  }

  matchesWhitelistedSegments(envelope: IUserUpdateEnvelope): boolean {
    const messageSegmentIds = envelope.message.segments.map(s => s.id);
    if (_.intersection(messageSegmentIds, this.synchronizedSegments).length > 0) {
      return true;
    }
    return false;
  }
}

module.exports = FilterUtil;
