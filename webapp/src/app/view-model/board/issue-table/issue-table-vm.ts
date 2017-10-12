import {List, Map} from 'immutable';
import {BoardIssue} from '../../../model/board/data/issue/board-issue';

export interface IssueTableVm {
  issues: Map<string, BoardIssue>;
  table: List<List<string>>;
}
