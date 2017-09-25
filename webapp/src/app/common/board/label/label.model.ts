import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import {List} from 'immutable';


export interface LabelState {
  labels: List<string>;
}

const DEFAULT_STATE: LabelState = {
  labels: List<string>()
};

interface LabelStateRecord extends TypedRecord<LabelStateRecord>, LabelState {
}

const STATE_FACTORY = makeTypedFactory<LabelState, LabelStateRecord>(DEFAULT_STATE);
export const initialLabelState: LabelState = STATE_FACTORY(DEFAULT_STATE);

export class LabelUtil {
  static toStateRecord(s: LabelState): LabelStateRecord {
    // TODO do some checks. TS does not allow use of instanceof when the type is an interface (since they are compiled away)
    return <LabelStateRecord>s;
  }
}

