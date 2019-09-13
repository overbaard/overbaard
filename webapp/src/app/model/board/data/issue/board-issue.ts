import {Assignee} from '../assignee/assignee.model';
import {Priority} from '../priority/priority.model';
import {IssueType} from '../issue-type/issue-type.model';
import {List, Map, OrderedSet} from 'immutable';
import {CustomFieldValue} from '../custom-field/custom-field.model';
import {Issue} from './issue';
import {ParallelTask} from '../project/project.model';
import {LinkedIssue} from './linked-issue';
import {Epic} from '../epic/epic.model';

export interface BoardIssue extends Issue {
  projectCode: string;
  assignee: Assignee;
  priority: Priority;
  type: IssueType;
  epic: Epic;
  parentKey: string;
  components: OrderedSet<string>;
  labels: OrderedSet<string>;
  fixVersions: OrderedSet<string>;
  customFields: Map<string, CustomFieldValue>;
  parallelTasks: List<List<ParallelTask>>;
  selectedParallelTasks: List<List<number>>;
  linkedIssues: List<LinkedIssue>;
  ownState: number;

}
