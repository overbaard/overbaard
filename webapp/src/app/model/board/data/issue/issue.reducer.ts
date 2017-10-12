import {AppState} from '../../../../app-store';
import {Action} from '@ngrx/store';
import {DeserializeIssueLookupParams, initialIssueState, IssueChangeInfo, IssueState, IssueUtil} from './issue.model';
import {createSelector} from 'reselect';
import {List, Map} from 'immutable';
import {BoardIssue} from './board-issue';


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

// 'meta-reducer here means it is not called directly by the store, rather from the boardReducer
export function issueMetaReducer(state: IssueState = initialIssueState, action: Action): IssueState {

  switch (action.type) {
    case DESERIALIZE_INITIAL_ISSUES: {
      const payload: Map<string, BoardIssue> = (<DeserializeIssuesAction>action).payload;
      let changed: Map<string, IssueChangeInfo> = null;
      let newMap: Map<string, BoardIssue>;
      if (state.issues.size === 0) {
        // We are doing a full refresh so don't record the changes
        newMap = payload;
      } else {
        // We have been sent the full board when polling for changes, but already have a copy. Only update what is needed.
        changed = Map<string, IssueChangeInfo>().asMutable();
        newMap = Map<string, BoardIssue>().withMutations(mutable => {
          payload.forEach((issue, key) => {
            const existing: BoardIssue = state.issues.get(key);
            if (existing == null || !IssueUtil.toIssueRecord(existing).equals(IssueUtil.toIssueRecord(issue))) {
              // It is a new issue, or an existing one with a change
              mutable.set(key, issue);
              changed.set(issue.key, IssueUtil.createChangeInfo(existing, issue));
            } else {
              mutable.set(key, existing);
            }
          });
        });
        // Record the deleted ones
        state.issues
          .filter((issue, key) => !newMap.get(key))
          .forEach(issue => changed.set(issue.key, IssueUtil.createChangeInfo(issue, null)));

        changed = changed.size > 0 ? changed.asImmutable() : null;
      }

      const newState: IssueState = IssueUtil.toStateRecord(state).withMutations(mutable => {
        mutable.lastChanged = changed;
        mutable.issues = newMap;
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
        const changed: Map<string, IssueChangeInfo> = Map<string, IssueChangeInfo>().asMutable();
        if (payload.issueChanges) {
          mState.issues = mState.issues.withMutations(mIssues => {
            payload.issueChanges.forEach(change => {
              // For new issues on the board, original will be null
              const original: BoardIssue = mIssues.get(change.key);
              const current: BoardIssue = IssueUtil.updateIssue(original, change);
              mIssues.set(change.key, current);
              changed.set(change.key, IssueUtil.createChangeInfo(original, current));
            });
          });
        }
        // delete does not work on a mutable map
        if (payload.deletedIssues) {
          payload.deletedIssues.forEach(key => {
            const deletedIssue = mState.issues.get(key);
            mState.issues = mState.issues.delete(key);
            changed.set(key, IssueUtil.createChangeInfo(deletedIssue, null));
          });
        }
        mState.lastChanged = changed.asImmutable();
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


