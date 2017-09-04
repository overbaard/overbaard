import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import {List, OrderedMap} from 'immutable';


export interface LabelState {
  labels: List<string>;
}

const DEFAULT_STATE: LabelState = {
  labels: List<string>()
};

export interface LabelStateRecord extends TypedRecord<LabelStateRecord>, LabelState {
}

const STATE_FACTORY = makeTypedFactory<LabelState, LabelStateRecord>(DEFAULT_STATE);
export const initialLabelState: LabelState = STATE_FACTORY(DEFAULT_STATE);

export class LabelStateModifier {
  static update(state: LabelState, updater: (copy: LabelState) => void) {
    return (<LabelStateRecord>state).withMutations(updater);
  }
}

