import {AppState} from '../../../app-store';
import {Action} from '@ngrx/store';
import {
  BoardIssue, DeserializeIssueLookupParams, initialIssueState, IssueState,
  IssueUtil
} from './issue.model';
import {createSelector} from 'reselect';
import {List, Map} from 'immutable';


const DESERIALIZE_INITIAL_ISSUES = 'DESERIALIZE_INITIAL_ISSUES';
const CHANGE_ISSUES = 'CHANGE_ISSUES';

class DeserializeIssuesAction implements Action {
  readonly type = DESERIALIZE_INITIAL_ISSUES;

  constructor(readonly payload: Map<string, BoardIssue>) {
  }
}

class ChangeIssuesAction implements Action {
  readonly type = CHANGE_ISSUES;

  constructor(readonly payload: ChangeIssuesPayload) {
  }
}

export class IssueActions {
  static createDeserializeIssuesAction(input: any, params: DeserializeIssueLookupParams): Action {
    const issues: Map<string, BoardIssue> = Map<string, BoardIssue>().withMutations(mutable => {
      if (!input) {
        return;
      }
      for (const key of Object.keys(input)) {
        const issueInput = input[key];
        const issue: BoardIssue = IssueUtil.fromJS(issueInput, params);
        mutable.set(key, issue);
      }
    });
    return new DeserializeIssuesAction(issues);
  }

  static createChangeIssuesAction(input: any, params: DeserializeIssueLookupParams): Action {
    const deletedKeys: string[] = <string[]>input['delete'];

    let newIssues: List<BoardIssue>;
    if (input['new']) {
      newIssues = List<BoardIssue>().withMutations(mutable => {
        for (const issueInput of <any[]>input['new']) {

        }
      });
    }

    let updatedIssues: List<BoardIssue>;
    if (input['new']) {
      updatedIssues = List<BoardIssue>().withMutations(mutable => {
        for (const issueInput of <any[]>input['update']) {

        }
      });
    }
    return new ChangeIssuesAction({newIssues: newIssues, changedIssues: updatedIssues, deletedIssues: deletedKeys});
  }
}

export function issueReducer(state: IssueState = initialIssueState, action: Action): IssueState {

  switch (action.type) {
    case DESERIALIZE_INITIAL_ISSUES: {
      const payload: Map<string, BoardIssue> = (<DeserializeIssuesAction>action).payload;
      const newState: IssueState = IssueUtil.toStateRecord(state).withMutations(mutable => {
        mutable.issues = payload;
      });

      if (IssueUtil.toStateRecord(newState).equals(IssueUtil.toStateRecord(state))) {
        return state;
      }
      return newState;
    }
    default:
      return state;
  }
};

interface ChangeIssuesPayload {
  changedIssues: List<BoardIssue>;
  newIssues: List<BoardIssue>;
  deletedIssues: string[];
}

const getIssuesState = (state: AppState) => state.board.issues;
const getIssues = (state: IssueState) => state.issues;
export const issuesSelector = createSelector(getIssuesState, getIssues);


