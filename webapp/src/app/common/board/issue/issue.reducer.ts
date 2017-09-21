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

    let issueChanges: List<BoardIssue>;
    if (input['new'] || input['update']) {
      issueChanges = List<BoardIssue>().withMutations(mutable => {
        if (input['new']) {
          (<any[]>input['new']).forEach(v => mutable.push(IssueUtil.issueChangeFromJs(v, params)));
        }
        if (input['update']) {
          (<any[]>input['update']).forEach(v => mutable.push(IssueUtil.issueChangeFromJs(v, params)));
        }
      });
    }
    return new ChangeIssuesAction({issueChanges: issueChanges, deletedIssues: deletedKeys});
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
    case CHANGE_ISSUES: {
      const payload: ChangeIssuesPayload = (<ChangeIssuesAction>action).payload;
      if (!payload.issueChanges && !payload.deletedIssues) {
        return state;
      }
      return IssueUtil.toStateRecord(state).withMutations(mState => {
        if (payload.issueChanges) {
          mState.issues = mState.issues.withMutations(mIssues => {
            payload.issueChanges.forEach(change => {
              // For new issues on the board, original will be null
              const original: BoardIssue = mIssues.get(change.key);
              mIssues.set(change.key, IssueUtil.updateIssue(original, change));
            });
          });
        }
        // delete does not work on a mutable map
        if (payload.deletedIssues) {
          payload.deletedIssues.forEach(key => mState.issues = mState.issues.delete(key));
        }
      });
    }
    default:
      return state;
  }
};

interface ChangeIssuesPayload {
  // This contains both new and changed issues
  issueChanges: List<BoardIssue>;
  deletedIssues: string[];
}

const getIssuesState = (state: AppState) => state.board.issues;
const getIssues = (state: IssueState) => state.issues;
export const issuesSelector = createSelector(getIssuesState, getIssues);


