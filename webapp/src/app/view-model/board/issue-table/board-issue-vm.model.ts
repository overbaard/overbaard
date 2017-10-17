import {is, List, Map} from 'immutable';
import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import {BoardIssue} from '../../../model/board/data/issue/board-issue';
import {IssueTableVm} from './issue-table-vm';
import {BoardIssueVm} from './board-issue-vm';
import {NO_ASSIGNEE} from '../../../model/board/data/assignee/assignee.model';
import {CustomField} from '../../../model/board/data/custom-field/custom-field.model';
import {Issue} from '../../../model/board/data/issue/issue';

const DEFAULT_STATE: BoardIssueVm = {
  // Fields from core issue
  key: null,
  projectCode: null,
  summary: null,
  assignee: NO_ASSIGNEE,
  priority: null,
  type: null,
  components: null,
  labels: null,
  fixVersions: null,
  customFields: Map<string, CustomField>(),
  parallelTasks: null,
  linkedIssues: List<Issue>(),
  ownState: -1
};

interface BoardIssueVmRecord extends TypedRecord<BoardIssueVmRecord>, BoardIssueVm {
}

const ISSUE_FACTORY = makeTypedFactory<BoardIssueVm, BoardIssueVmRecord>(DEFAULT_STATE);

export class BoardIssueVmUtil {

  static toIssueRecord(s: BoardIssueVm): BoardIssueVmRecord {
    // TODO do some checks. TS does not allow use of instanceof when the type is an interface (since they are compiled away)
    return <BoardIssueVmRecord>s;
  }

  static createBoardIssueVm(issue: BoardIssue): BoardIssueVmRecord {
    return ISSUE_FACTORY({
      key: issue.key,
      projectCode: issue.projectCode,
      summary: issue.summary,
      assignee: issue.assignee,
      priority: issue.priority,
      type: issue.type,
      components: issue.components,
      labels: issue.labels,
      fixVersions: issue.fixVersions,
      customFields: issue.customFields,
      parallelTasks: issue.parallelTasks,
      linkedIssues: issue.linkedIssues,
      ownState: issue.ownState
    });
  }

  static equals(one: BoardIssueVm, two: BoardIssueVm) {
    return BoardIssueVmUtil.toIssueRecord(one).equals(BoardIssueVmUtil.toIssueRecord(two));
  }
}
