import {List} from 'immutable';
import {BoardIssue} from '../../../model/board/issue/board-issue';

export interface IssueTableVm {
  table: List<List<BoardIssue>>;
}
