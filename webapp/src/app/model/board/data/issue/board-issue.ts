import {Assignee} from '../assignee/assignee.model';
import {Priority} from '../priority/priority.model';
import {IssueType} from '../issue-type/issue-type.model';
import {List, Map, OrderedSet} from 'immutable';
import {CustomField} from '../custom-field/custom-field.model';
import {Issue} from './issue';
import {ParallelTask, ParallelTaskOption} from '../project/project.model';

export interface BoardIssue extends Issue {
  projectCode: string;
  assignee: Assignee;
  priority: Priority;
  type: IssueType;
  components: OrderedSet<string>;
  labels: OrderedSet<string>;
  fixVersions: OrderedSet<string>;
  customFields: Map<string, CustomField>;
  parallelTasks: List<ParallelTask>;
  selectedParallelTasks: List<number>;
  linkedIssues: List<Issue>;
  ownState: number;

}
