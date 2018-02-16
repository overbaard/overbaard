import {List, Map} from 'immutable';
import {BoardIssueView} from './board-issue-view';
import {SwimlaneInfo} from './swimlane-info';
import {BoardViewMode} from '../../model/board/user/board-view-mode';
import {RankViewEntry} from './rank-view-entry';

export interface IssueTable {
  // Fields for internal state tracking, should not be used by the UI
  issues: Map<string, BoardIssueView>;
  totalIssues: List<number>;
  visibleIssues: List<number>;

  // Fields used by the UI
  rankView: List<RankViewEntry>;
  table: List<List<BoardIssueView>>;
  swimlaneInfo: SwimlaneInfo;
}
