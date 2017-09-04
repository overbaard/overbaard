import {AppState} from '../../../app-store';
import {Action} from '@ngrx/store';
import {BoardIssue, initialIssueState, IssueFactory, IssueState, IssueStateModifier} from './issue.model';
import {Assignee} from '../assignee/assignee.model';
import {createSelector} from 'reselect';
import {IssueType} from '../issue-type/issue-type.model';
import {Priority} from '../priority/priority.model';
import {List} from 'immutable';


const DESERIALIZE_INITIAL_ISSUES = 'DESERIALIZE_INITIAL_ISSUES';

class DeserializeIssuesAction implements Action {
  readonly type = DESERIALIZE_INITIAL_ISSUES;

  constructor(readonly payload: BoardIssue[]) {
  }
}

export class IssueActions {
  static createDeserializeIssuesAction(input: any, assignees: Assignee[], issueTypes: IssueType[],
                                       priorities: Priority[], components: List<string>,
                                       labels: List<string>, fixVersions: List<string>): Action {
    const inputArray: any[] = input ? input : [];
    const issues = new Array<BoardIssue>(inputArray.length);
    inputArray.forEach((issue, i) => {
      issues[i] = IssueFactory.fromJS(issue, assignees, priorities, issueTypes, components, labels, fixVersions);
    });
    return new DeserializeIssuesAction(issues);
  }
}

export function issueReducer(state: IssueState = initialIssueState, action: Action): IssueState {

  switch (action.type) {
    case DESERIALIZE_INITIAL_ISSUES: {
      const payload: BoardIssue[] = (<DeserializeIssuesAction>action).payload;
      let issues = state.issues;
      issues = issues.withMutations(mutable => {
        for (const issue of payload) {
          mutable.set(issue.key, issue);
        }
      });
      return IssueStateModifier.update(state, copy => {
        copy.issues = issues;
      });
    }
    default:
      return state;
  }
};

const getIssuesState = (state: AppState) => state.board.issues;
const getIssues = (state: IssueState) => state.issues;
export const issuesSelector = createSelector(getIssuesState, getIssues);


