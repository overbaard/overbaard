import {Action, ActionReducer, combineReducers} from '@ngrx/store';
import {AppState} from '../../app-store';
import {IssueTypeActions, issueTypeReducer} from './issue-type/issue-type.reducer';
import {IssueActions, issueReducer} from './issue/issue.reducer';
import {AssigneeActions, assigneeReducer} from './assignee/assignee.reducer';
import {PriorityActions, priorityReducer} from './priority/priority.reducer';
import {HeaderActions, headerReducer} from './header/header.reducer';
import {ProjectActions, projectReducer} from './project/project.reducer';
import {AssigneeState, initialAssigneeState} from './assignee/assignee.model';
import {HeaderState, initialHeaderState} from './header/header.model';
import {initialIssueState, IssueState} from './issue/issue.model';
import {initialIssueTypeState, IssueTypeState} from './issue-type/issue-type.model';
import {initialPriorityState, PriorityState} from './priority/priority.model';
import {initialProjectState, ProjectState} from './project/project.model';
import {ComponentState, initialComponentState} from './component/component.model';
import {ComponentActions, componentReducer} from './component/component.reducer';
import {initialLabelState, LabelState} from './label/label.model';
import {LabelActions, labelReducer} from './label/label.reducer';
import {FixVersionState, initialFixVersionState} from './fix-version/fix-version.model';
import {FixVersionActions, fixVersionReducer} from './fix-version/fix-version.reducer';
import {CustomFieldState, initialCustomFieldState} from './custom-field/custom-field.model';
import {CustomFieldActions, customFieldReducer} from './custom-field/custom-field.reducer';

export interface BoardState {
  viewId: number;
  rankCustomFieldId: number;
  headers: HeaderState;
  assignees: AssigneeState;
  issueTypes: IssueTypeState;
  priorities: PriorityState;
  components: ComponentState;
  labels: LabelState;
  fixVersions: FixVersionState;
  customFields: CustomFieldState;
  projects: ProjectState;
  issues: IssueState;
}

const initialState: BoardState = {
  viewId: 0,
  rankCustomFieldId: 0,
  headers: initialHeaderState,
  assignees: initialAssigneeState,
  issueTypes: initialIssueTypeState,
  priorities: initialPriorityState,
  components: initialComponentState,
  labels: initialLabelState,
  fixVersions: initialFixVersionState,
  customFields: initialCustomFieldState,
  projects: initialProjectState,
  issues: initialIssueState
};

const reducers = {
  board: boardReducer,
  headers: headerReducer,
  assignees: assigneeReducer,
  issueTypes: issueTypeReducer,
  priorities: priorityReducer,
  components: componentReducer,
  labels: labelReducer,
  fixVersions: fixVersionReducer,
  customFields: customFieldReducer,
  projects: projectReducer,
  issues: issueReducer
};

const reducerInstance: ActionReducer<BoardState> = combineReducers(reducers);

export function reducer(state: any, action: any) {
  return reducerInstance(state, action);
}

const DESERIALIZE_BOARD = 'DESERIALIZE_BOARD';
const PROCESS_BOARD_CHANGES = 'PROCESS_BOARD_CHANGES';
const PROCESS_BOARD_FULL_REFRESH = 'PROCESS_BOARD_FULL_REFRESH';

abstract class BoardDataAction {
  constructor(readonly type: string, readonly payload: any) {
  }
}

class DeserializeBoardAction extends BoardDataAction {
  constructor(payload: any) {
    super(DESERIALIZE_BOARD, payload);
  }
}

class ProcessBoardChangesAction extends BoardDataAction {
  constructor(payload: any) {
    super(PROCESS_BOARD_CHANGES, payload);
  }
}

class ProcessBoardFullRefreshAction extends BoardDataAction {
  constructor(payload: any) {
    super(PROCESS_BOARD_FULL_REFRESH, payload);
  }
}


export class BoardActions {

  static deserializeBoard(input: any) {
    return new DeserializeBoardAction(input);
  }

  static processChanges(input: any) {
    return new ProcessBoardChangesAction(input);
  }

  static processFullRefresh(input: any) {
    return new ProcessBoardFullRefreshAction(input);
  }
}

export function boardReducer(state: BoardState = initialState, action: Action): BoardState {

  switch (action.type) {
    case DESERIALIZE_BOARD: {
      const input = action.payload;
      const viewId: number = input['view'];
      const rankCustomFieldId = input['rank-custom-field-id'];
      const headers =
        reducers.headers(state.headers, HeaderActions.createDeserializeHeaders(
          input['states'],
          input['headers'],
          input['backlog'] ? input['backlog'] : 0,
          input['done'] ? input['done'] : 0));
      const assigneeState =
        reducers.assignees(state.assignees, AssigneeActions.createAddInitialAssignees(input['assignees']));
      const priorityState =
        reducers.priorities(state.priorities, PriorityActions.createDeserializePriorities(input['priorities']));
      const issueTypeState =
        reducers.issueTypes(state.issueTypes, IssueTypeActions.createDeserializeIssueTypes(input['issue-types']));
      const componentState =
        reducers.components(state.components, ComponentActions.createDeserializeComponents(input['components']));
      const labelState =
        reducers.labels(state.labels, LabelActions.createDeserializeLabels(input['labels']));
      const fixVersionState =
        reducers.fixVersions(state.fixVersions, FixVersionActions.createDeserializeFixVersions(input['fix-versions']));
      const customFieldState =
        reducers.customFields(state.customFields, CustomFieldActions.createDeserializeCustomFields(input['custom']));
      const projectState =
        reducers.projects(state.projects, ProjectActions.createDeserializeProjects(input['projects']));
      const issueState =
        reducers.issues(state.issues, IssueActions.createDeserializeIssuesAction(input['issues'],
          assigneeState.assignees.toArray(), issueTypeState.types.toArray(), priorityState.priorities.toArray(),
          componentState.components, labelState.labels, fixVersionState.versions, customFieldState.fields));

      return {
        viewId: viewId,
        rankCustomFieldId: rankCustomFieldId,
        headers: headers,
        assignees: assigneeState,
        issueTypes: issueTypeState,
        priorities: priorityState,
        components: componentState,
        fixVersions: fixVersionState,
        labels: labelState,
        customFields: customFieldState,
        projects: projectState,
        issues: issueState
      };
    }
    // TODO the others
    default:
      return state;
  }
}

const getBoardState = (state: AppState) => state.board;

