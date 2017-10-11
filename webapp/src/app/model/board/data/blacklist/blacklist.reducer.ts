import {Action} from '@ngrx/store';
import {BlacklistState, BlacklistUtil, initialBlacklistState} from './blacklist.model';
import {List, Set} from 'immutable';


const DESERIALIZE_BLACKLIST = 'DESERIALIZE_BLACKLIST';
const BLACKLIST_CHANGES = 'BLACKLIST_CHANGES';

class DeserializeBlacklistAction implements Action {
  readonly type = DESERIALIZE_BLACKLIST;

  constructor(readonly payload: BlacklistState) {
  }
}

class BlacklistChangesAction implements Action {
  readonly type = BLACKLIST_CHANGES;

  constructor(readonly payload: BlacklistChange) {
  }
}

export class BlacklistActions {
  static createDeserializeBlacklist(input: any): Action {
    return new DeserializeBlacklistAction(BlacklistUtil.fromJs(input ? input : {}));
  }

  static createChangeBlacklist(input: any): Action {
    const state: BlacklistState = BlacklistUtil.fromJs(input ? input : {});
    const change: BlacklistChange = input ?
      {
        states: state.states,
        issueTypes: state.issueTypes,
        priorities: state.priorities,
        issues: state.issues,
        removedIssues: input['removed-issues'] ? Set<string>(input['removed-issues']) : Set<string>()
      } : null;
    return new BlacklistChangesAction(change);
  }
}

// 'meta-reducer here means it is not called directly by the store, rather from the boardReducer
export function blacklistMetaReducer(state: BlacklistState = initialBlacklistState, action: Action): BlacklistState {

  switch (action.type) {
    case DESERIALIZE_BLACKLIST: {
      const payload: BlacklistState = (<DeserializeBlacklistAction>action).payload;
      if ((BlacklistUtil.toStateRecord(payload)).equals(BlacklistUtil.toStateRecord(state))) {
        return state;
      }
      return payload;
    }
    case BLACKLIST_CHANGES: {
      const payload: BlacklistChange = (<BlacklistChangesAction>action).payload;
      if (payload) {
        const states: List<string> = mergeListsAndSortIfNecessary(state.states, payload.states);
        const issueTypes: List<string> = mergeListsAndSortIfNecessary(state.issueTypes, payload.issueTypes);
        const priorities: List<string> = mergeListsAndSortIfNecessary(state.priorities, payload.priorities);
        let issues: List<string> = mergeListsAndSortIfNecessary(state.issues, payload.issues);
        if (payload.removedIssues.size > 0) {
          issues = removeIssues(issues, payload.removedIssues);
        }
        return BlacklistUtil.createStateRecord({
          states: states,
          issueTypes: issueTypes,
          priorities: priorities,
          issues: issues
        });
      }
      return state;
    }
    default:
      return state;
  }
};

function mergeListsAndSortIfNecessary(original: List<string>, additions: List<string>): List<string> {
  if (additions.size === 0) {
    return original;
  }
  return original.concat(additions).sort((a, b) => a.toLocaleLowerCase().localeCompare(b.toLocaleLowerCase())).toList();
}

function removeIssues(issues: List<string>, removals: Set<string>) {
  return List<string>().withMutations(mutable => {
    issues.forEach(v => {
      if (!removals.contains(v)) {
        mutable.push(v);
      }
    });
  });
}

interface BlacklistChange extends BlacklistState {
  removedIssues: Set<string>;
}
