import {List} from 'immutable';

export interface SwimlaneData {
  key: string;
  display: string;
  table: List<List<string>>;
  visibleIssues: number;
  filterVisible: boolean;
}
