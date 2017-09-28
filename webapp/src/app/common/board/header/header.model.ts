import {List} from 'immutable';
import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import {HeaderState} from './header.state';
import {Header} from './header';

const DEFAULT_STATE: HeaderState = {
  headers: List<List<Header>>(),
  states: List<string>()
};

const DEFAULT_HEADER: Header = {
  name: '',
  abbreviated: '',
  rows: 1,
  cols: 1,
  wip: 0,
  backlog: false,
  states: List<number>()
};

interface HeaderStateRecord extends TypedRecord<HeaderStateRecord>, HeaderState {
}

interface HeaderRecord extends TypedRecord<HeaderRecord>, Header {
}

const STATE_FACTORY = makeTypedFactory<HeaderState, HeaderStateRecord>(DEFAULT_STATE);
const HEADER_FACTORY = makeTypedFactory<Header, HeaderRecord>(DEFAULT_HEADER);
export const initialHeaderState: HeaderState = STATE_FACTORY(DEFAULT_STATE);

export class HeaderUtil {
  static fromObject(input: Header): Header {
    return HEADER_FACTORY(input);
  }

  static toStateRecord(s: HeaderState): HeaderStateRecord {
    // TODO do some checks. TS does not allow use of instanceof when the type is an interface (since they are compiled away)
    return <HeaderStateRecord>s;
  }
}

