/**
 * Although this comes initially serialized as part of the project state, store this separately
 * since the project json really has two parts:
 * - Dynamic stuff such as the issue ranks
 * - More static stuff such as the project key, available parallel-tasks, state mappings etc. which are set up in the config
 */
import {List, Map} from 'immutable';
import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';

export interface RankState {
  rankedIssueKeys: Map<string, List<string>>;
}

const DEFAULT_STATE: RankState = {
  rankedIssueKeys: Map<string, List<string>>()
};


interface RankStateRecord extends TypedRecord<RankStateRecord>, RankState {
}

const STATE_FACTORY = makeTypedFactory<RankState, RankStateRecord>(DEFAULT_STATE);
export const initialRankState: RankState = STATE_FACTORY(DEFAULT_STATE);

export class RankUtil {

  static withMutations(s: RankState, mutate: (mutable: RankState) => any): RankState {
    return (<RankStateRecord>s).withMutations(mutable => {
      mutate(mutable);
    });
  }
}
