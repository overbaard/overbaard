import {List} from 'immutable';
import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';

export interface HeaderRecord extends TypedRecord<HeaderRecord>, Header {
}

export interface Header {
  name: string;
  rows: number;
  cols: number;
  wip: number;
  backlog: boolean;
  states: List<number>;
}

const DEFAULT_HEADER: Header = {
  name: '',
  rows: 1,
  cols: 1,
  wip: 0,
  backlog: false,
  states: List<number>()
};

const HEADER_TYPED_FACTORY = makeTypedFactory<Header, HeaderRecord>(DEFAULT_HEADER);

export class HeaderFactory {
  static fromObject(input: Header): Header {
    return HEADER_TYPED_FACTORY(input);
  }
}
