import {List} from 'immutable';
import {Header} from '../../../model/board/data/header/header';

export interface HeadersView {
  headers: List<List<HeaderView>>;
  states: List<string>;
}

export interface HeaderView extends Header {
  visibleColumn: boolean;
  totalIssues: number;
  visibleIssues: number;
}
