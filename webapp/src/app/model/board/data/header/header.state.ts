import {List} from 'immutable';
import {Header} from './header';

export interface HeaderState {
  headers: List<List<Header>>;
  states: List<string>;
}
