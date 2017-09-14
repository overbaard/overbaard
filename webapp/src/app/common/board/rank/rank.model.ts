/**
 * Although this comes initially serialized as part of the project state, store this separately
 * since the project json really has two parts:
 * - Dynamic stuff such as the issue ranks
 * - More static stuff such as the project key, available parallel-tasks, state mappings etc. which are set up in the config
 */
import {List, Map, OrderedMap} from 'immutable';
import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import {HeaderState} from '../header/header.model';
import {ProjectState} from '../project/project.model';

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
   static toStateRecord(s: RankState): RankStateRecord {
    // TODO do some checks. TS does not allow use of instanceof when the type is an interface (since they are compiled away)
    return <RankStateRecord>s;
  }
}
