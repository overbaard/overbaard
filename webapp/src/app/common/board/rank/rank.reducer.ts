import {Action} from '@ngrx/store';
import {List, Map, OrderedMap} from 'immutable';
import {initialRankState, RankState, RankUtil} from './rank.model';

const DESERIALIZE_PROJECTS = 'DESERIALIZE_PROJECTS';

class DeserializeRanksAction implements Action {
  readonly type = DESERIALIZE_PROJECTS;

  // TODO payload
  constructor(readonly payload: RankState) {
  }
}

export class RankActions {
  static createDeserializeRanks(input: any): DeserializeRanksAction {
    const rankedIssueKeys: Map<string, List<string>> = Map<string, List<string>>().asMutable();

    for (const key of Object.keys(input)) {
      const projectInput: any = input[key];
      rankedIssueKeys.set(key, List<string>(projectInput['ranked']));
    }

    const payload: RankState = {
      rankedIssueKeys: rankedIssueKeys.asImmutable(),
    };

    return new DeserializeRanksAction(payload);
  }
}

export function rankReducer(state: RankState = initialRankState, action: Action): RankState {
  switch (action.type) {
    case DESERIALIZE_PROJECTS: {
      const payload: RankState = (<DeserializeRanksAction>action).payload;
      const newState: RankState = RankUtil.toStateRecord(state).withMutations(mutable => {
        mutable.rankedIssueKeys = payload.rankedIssueKeys;
      });

      return RankUtil.toStateRecord(newState).equals(RankUtil.toStateRecord(state)) ? state : newState;
    }
  }
  return state;
}
