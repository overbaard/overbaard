import {Action, ActionReducer, combineReducers} from '@ngrx/store';
import {AppState} from '../../app-store';
import {
  initialIssueTypeState,
  IssueTypeActions,
  issueTypeReducer,
  IssueTypeState
} from '../issue-type/issue-type.reducer';
import {initialIssueState, IssueActions, issueReducer, IssueState} from '../issue/issue.reducer';
import {AssigneeActions, assigneeReducer, AssigneeState, initialAssigneeState} from '../assignee/assignee.reducer';
import {initialPriorityState, PriorityActions, priorityReducer, PriorityState} from '../priority/priority.reducer';
import {HeaderActions, headerReducer, HeaderState, initialHeaderState} from '../header/header.reducer';
import {initialProjectState, ProjectActions, projectReducer, ProjectState} from '../project/project.reducer';

export interface BoardState {
  viewId: number;
  rankCustomFieldId: number;
  headers: HeaderState;
  assignees: AssigneeState;
  issueTypes: IssueTypeState;
  priorities: PriorityState;
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
  projects: initialProjectState,
  issues: initialIssueState
};

const reducers = {
  board: boardReducer,
  headers: headerReducer,
  assignees: assigneeReducer,
  issueTypes: issueTypeReducer,
  priorities: priorityReducer,
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
      const projectState =
        reducers.projects(state.projects, ProjectActions.createDeserializeProjects(input['projects']));
      const issueState =
        reducers.issues(state.issues, IssueActions.createDeserializeIssuesAction(input['issues'],
          assigneeState.assignees.toArray(), issueTypeState.types.toArray(), priorityState.priorities.toArray()));

      return {
        viewId: viewId,
        rankCustomFieldId: rankCustomFieldId,
        headers: headers,
        assignees: assigneeState,
        issueTypes: issueTypeState,
        priorities: priorityState,
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

