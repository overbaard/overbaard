import {List} from 'immutable';
import {BoardIssueView} from './board-issue-view';

export interface SwimlaneData {
  key: string;
  display: string;
  _old_table: List<List<string>>;
  table: List<List<BoardIssueView>>;
  visibleIssues: number;
  filterVisible: boolean;
  collapsed: boolean;
}
