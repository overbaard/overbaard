import {List, Map, OrderedMap} from 'immutable';
import {BoardIssue} from '../../../model/board/data/issue/board-issue';
import {BoardIssueVm} from './board-issue-vm';

export interface IssueTableVm {
  issues: Map<string, BoardIssueVm>;
  table: List<List<string>>;
  swimlaneInfo: SwimlaneInfoVm;
  visibleIssueCounts: List<number>;
}

export interface SwimlaneInfoVm {
  swimlanes: OrderedMap<string, SwimlaneDataVm>;
}

export interface SwimlaneDataVm {
  key: string;
  display: string;
  table: List<List<string>>;
  totalIssues: number;
  visibleIssues: number;
}


