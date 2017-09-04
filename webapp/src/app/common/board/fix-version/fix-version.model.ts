import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import {List, OrderedMap} from 'immutable';


export interface FixVersionState {
  versions: List<string>;
}

const DEFAULT_STATE: FixVersionState = {
  versions: List<string>()
};

export interface FixVersionStateRecord extends TypedRecord<FixVersionStateRecord>, FixVersionState {
}

const STATE_FACTORY = makeTypedFactory<FixVersionState, FixVersionStateRecord>(DEFAULT_STATE);
export const initialFixVersionState: FixVersionState = STATE_FACTORY(DEFAULT_STATE);

export class FixVersionStateModifier {
  static update(state: FixVersionState, updater: (copy: FixVersionState) => void) {
    return (<FixVersionStateRecord>state).withMutations(updater);
  }
}

