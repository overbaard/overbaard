import {IssueSummaryLevel} from '../issue-summary-level';
import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';

export interface IssueDetailState {
  issueSummaryLevel: IssueSummaryLevel;
  parallelTasks: boolean;
  linkedIssues: boolean;
  rankingOrder: boolean;
}

const DEFAULT_ISSUE_DETAIL_STATE: IssueDetailState = {
  issueSummaryLevel: IssueSummaryLevel.FULL,
  parallelTasks: true,
  linkedIssues: true,
  rankingOrder: false
};

interface IssueDetailStateRecord extends TypedRecord<IssueDetailStateRecord>, IssueDetailState {
}

const DETAIL_STATE_FACTORY = makeTypedFactory<IssueDetailState, IssueDetailStateRecord>(DEFAULT_ISSUE_DETAIL_STATE);

export const initialIssueDetailState: IssueDetailState = DETAIL_STATE_FACTORY(DEFAULT_ISSUE_DETAIL_STATE);

export class IssueDetailUtil {
  static updateIssueDetailState(issueDetailState: IssueDetailState, mutate: (mutable: IssueDetailState) => any): IssueDetailState {
    return (<IssueDetailStateRecord>issueDetailState).withMutations(mutable => {
      return mutate(mutable);
    });
  }

}
