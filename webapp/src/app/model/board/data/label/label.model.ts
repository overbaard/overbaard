import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import {List} from 'immutable';
import {PriorityState} from '../priority/priority.model';


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
  static withMutations(s: LabelState, mutate: (mutable: LabelState) => any): LabelState {
    return (<LabelStateRecord>s).withMutations(mutable => {
      mutate(mutable);
    });
  }
}

