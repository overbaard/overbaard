import {HeaderState} from './header/header.state';
import {AssigneeState} from './assignee/assignee.model';
import {IssueTypeState} from './issue-type/issue-type.model';
import {PriorityState} from './priority/priority.model';
import {ComponentState} from './component/component.model';
import {LabelState} from './label/label.model';
import {FixVersionState} from './fix-version/fix-version.model';
import {CustomFieldState} from './custom-field/custom-field.model';
import {ProjectState} from './project/project.model';
import {RankState} from './rank/rank.model';
import {IssueState} from './issue/issue.model';
import {BlacklistState} from './blacklist/blacklist.model';

export interface BoardState {
  viewId: number;
  rankCustomFieldId: number;
  jiraUrl: string;
  headers: HeaderState;
  assignees: AssigneeState;
  issueTypes: IssueTypeState;
  priorities: PriorityState;
  components: ComponentState;
  labels: LabelState;
  fixVersions: FixVersionState;
  customFields: CustomFieldState;
  projects: ProjectState;
  ranks: RankState;
  issues: IssueState;
  blacklist: BlacklistState;
}
