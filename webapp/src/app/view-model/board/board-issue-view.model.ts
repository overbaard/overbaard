import {List, Map} from 'immutable';
import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import {BoardIssue} from '../../model/board/data/issue/board-issue';
import {BoardIssueView} from './board-issue-view';
import {NO_ASSIGNEE} from '../../model/board/data/assignee/assignee.model';
import {CustomField} from '../../model/board/data/custom-field/custom-field.model';
import {Issue} from '../../model/board/data/issue/issue';

const DEFAULT_STATE: BoardIssueView = {
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
  selectedParallelTasks: null,
  linkedIssues: List<Issue>(),
  ownState: -1,
  visible: true,
  projectColour: 'red',
  issueUrl: ''
};

interface BoardIssueViewRecord extends TypedRecord<BoardIssueViewRecord>, BoardIssueView {
}

const ISSUE_FACTORY = makeTypedFactory<BoardIssueView, BoardIssueViewRecord>(DEFAULT_STATE);

export class BoardIssueViewUtil {

  static toIssueRecord(s: BoardIssueView): BoardIssueViewRecord {
    // TODO do some checks. TS does not allow use of instanceof when the type is an interface (since they are compiled away)
    return <BoardIssueViewRecord>s;
  }

  static createBoardIssue(issue: BoardIssue, jiraUrl: string, projectColour: string, visible: boolean): BoardIssueViewRecord {
    const issueUrl = `${jiraUrl}browse/${issue.key}`;
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
      selectedParallelTasks: issue.selectedParallelTasks,
      linkedIssues: issue.linkedIssues,
      ownState: issue.ownState,
      visible: visible,
      projectColour: projectColour,
      issueUrl: issueUrl
    });
  }

  static equals(one: BoardIssueView, two: BoardIssueView) {
    return BoardIssueViewUtil.toIssueRecord(one).equals(BoardIssueViewUtil.toIssueRecord(two));
  }

  static updateVisibility(issue: BoardIssueView, visible: boolean): BoardIssueView {
    return BoardIssueViewUtil.toIssueRecord(issue).withMutations(mutable => {
      mutable.visible = visible;
    })
  }
}
