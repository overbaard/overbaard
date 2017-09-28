import {List} from 'immutable';

export interface Header {
  name: string;
  abbreviated: string;
  rows: number;
  cols: number;
  wip: number;
  backlog: boolean;
  states: List<number>;
}
