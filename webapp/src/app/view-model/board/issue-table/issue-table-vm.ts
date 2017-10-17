import {List, Map} from 'immutable';
import {BoardIssue} from '../../../model/board/data/issue/board-issue';
import {BoardIssueVm} from './board-issue-vm';

export interface IssueTableVm {
  issues: Map<string, BoardIssueVm>;
  table: List<List<string>>;
  issueVisibilities: Map<string, boolean>;
}
