import {BoardHeaders} from './board-headers';
import {IssueTable} from './issue-table';

export interface BoardViewModel {
  headers: BoardHeaders;
  issueTable: IssueTable
}
