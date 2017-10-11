import {List} from 'immutable';
import {BoardIssue} from '../../../model/board/data/issue/board-issue';

export interface IssueTableVm {
  table: List<List<BoardIssue>>;
}
