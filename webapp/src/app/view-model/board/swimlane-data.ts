import {List} from 'immutable';
import {BoardIssueView} from './board-issue-view';

export interface SwimlaneData {
  key: string;
  display: string;
  table: List<List<BoardIssueView>>;
  visibleIssues: number;
  collapsed: boolean;
  headerHeight: number;
  calculatedTotalIssuesHeight: number
}
