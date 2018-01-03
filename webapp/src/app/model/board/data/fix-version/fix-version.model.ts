import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import {List} from 'immutable';
import {LabelState} from '../label/label.model';


export interface FixVersionState {
  versions: List<string>;
}

const DEFAULT_STATE: FixVersionState = {
  versions: List<string>()
};

interface FixVersionStateRecord extends TypedRecord<FixVersionStateRecord>, FixVersionState {
}

const STATE_FACTORY = makeTypedFactory<FixVersionState, FixVersionStateRecord>(DEFAULT_STATE);
export const initialFixVersionState: FixVersionState = STATE_FACTORY(DEFAULT_STATE);

export class FixVersionUtil {
  static withMutations(s: FixVersionState, mutate: (mutable: FixVersionState) => any): FixVersionState {
    return (<FixVersionStateRecord>s).withMutations(mutable => {
      mutate(mutable);
    });
  }
}

