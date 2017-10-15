import {Assignee} from '../assignee/assignee.model';
import {Priority} from '../priority/priority.model';
import {IssueType} from '../issue-type/issue-type.model';
import {List, Map} from 'immutable';
import {CustomField} from '../custom-field/custom-field.model';
import {Issue} from './issue';

export interface BoardIssue extends Issue {
  assignee: Assignee;
  priority: Priority;
  type: IssueType;
  components: List<string>;
  labels: List<string>;
  fixVersions: List<string>;
  customFields: Map<string, CustomField>;
  parallelTasks: List<string>;
  linkedIssues: List<Issue>;
  ownState: number;

}
