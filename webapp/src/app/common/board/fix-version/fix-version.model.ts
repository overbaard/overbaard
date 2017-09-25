import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import {List} from 'immutable';


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
  static toStateRecord(s: FixVersionState): FixVersionStateRecord {
    // TODO do some checks. TS does not allow use of instanceof when the type is an interface (since they are compiled away)
    return <FixVersionStateRecord>s;
  }
}

