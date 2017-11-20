import {List} from 'immutable';
import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import {HeaderState} from './header.state';

const DEFAULT_STATE: HeaderState = {
  states: List<string>(),
  wip: List<number>(),
  categories: List<string>(),
  stateToCategoryMappings: List<number>(),
  backlog: 0
}

interface HeaderStateRecord extends TypedRecord<HeaderStateRecord>, HeaderState {
}


const STATE_FACTORY = makeTypedFactory<HeaderState, HeaderStateRecord>(DEFAULT_STATE);
export const initialHeaderState: HeaderState = STATE_FACTORY(DEFAULT_STATE);

export class HeaderUtil {
  static toStateRecord(s: HeaderState): HeaderStateRecord {
    // TODO do some checks. TS does not allow use of instanceof when the type is an interface (since they are compiled away)
    return <HeaderStateRecord>s;
  }
}
