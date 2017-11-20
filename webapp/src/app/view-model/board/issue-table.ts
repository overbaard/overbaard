import {List, Map} from 'immutable';
import {BoardIssueView} from './board-issue-view';
import {SwimlaneInfo} from './swimlane-info';

export interface IssueTable {
  issues: Map<string, BoardIssueView>;
  table: List<List<string>>;
  swimlaneInfo: SwimlaneInfo;
}
