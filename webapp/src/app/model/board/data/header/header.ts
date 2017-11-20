import {List} from 'immutable';

/* tslint:disable:class-name */
export interface _Header {
  name: string;
  abbreviated: string;
  rows: number;
  cols: number;
  wip: number;
  backlog: boolean;
  states: List<number>;
}
