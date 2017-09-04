import {List} from 'immutable';
import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';

export interface HeaderState {
  headers: List<List<Header>>;
}

export interface Header {
  name: string;
  rows: number;
  cols: number;
  wip: number;
  backlog: boolean;
  states: List<number>;
}

const DEFAULT_STATE: HeaderState = {
  headers: List<List<Header>>()
};

const DEFAULT_HEADER: Header = {
  name: '',
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

export class HeaderFactory {
  static fromObject(input: Header): Header {
    return HEADER_FACTORY(input);
  }
}

export class HeaderStateModifier {
  static update(state: HeaderState, updater: (copy: HeaderState) => void) {
    return (<HeaderStateRecord>state).withMutations(updater);
  }
}

