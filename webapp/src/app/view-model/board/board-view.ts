import {BoardHeaders} from './board-headers';
import {IssueTable} from './issue-table';
import {IssueDetailState} from '../../model/board/user/issue-detail/issue-detail.model';

export interface BoardViewModel {
  headers: BoardHeaders;
  issueTable: IssueTable;
  issueDetail: IssueDetailState;
}
