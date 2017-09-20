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
import {DeserializeIssueLookupParams, initialIssueState, IssueState} from './issue/issue.model';
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
import {BlacklistState, initialBlacklistState} from './blacklist/blacklist.model';
import {BlacklistActions, blacklistReducer} from './blacklist/blacklist.reducer';
import {Map} from 'immutable';
import {issueTableReducer} from './calculated/issue-table/issue-table.reducer';
import {initialIssueTableState, IssueTableState} from './calculated/issue-table/issue-table.model';
import {initialRankState, RankState} from './rank/rank.model';
import {RankActions, rankReducer} from './rank/rank.reducer';

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
  ranks: RankState;
  issues: IssueState;
  blacklist: BlacklistState;
}


export const initialBoardState: BoardState = {
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
  ranks: initialRankState,
  issues: initialIssueState,
  blacklist: initialBlacklistState
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
  ranks: rankReducer,
  issues: issueReducer,
  blacklist: blacklistReducer
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

  static createDeserializeBoard(input: any) {
    return new DeserializeBoardAction(input);
  }

  static processChanges(input: any) {
    return new ProcessBoardChangesAction(input);
  }

  static processFullRefresh(input: any) {
    return new ProcessBoardFullRefreshAction(input);
  }
}

export function boardReducer(state: BoardState = initialBoardState, action: Action): BoardState {

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

      // These will always be present
      const assigneeState: AssigneeState =
          reducers.assignees(state.assignees, AssigneeActions.createAddInitialAssignees(input['assignees']));
      const priorityState: PriorityState =
        reducers.priorities(state.priorities, PriorityActions.createDeserializePriorities(input['priorities']));
      const issueTypeState: IssueTypeState =
        reducers.issueTypes(state.issueTypes, IssueTypeActions.createDeserializeIssueTypes(input['issue-types']));

      // These might not be there
      const componentState: ComponentState = input['components'] ?
        reducers.components(state.components, ComponentActions.createDeserializeComponents(input['components']))
        : initialComponentState;
      const labelState: LabelState = input['labels'] ?
        reducers.labels(state.labels, LabelActions.createDeserializeLabels(input['labels']))
        : initialLabelState;
      const fixVersionState: FixVersionState = input['labels'] ?
        reducers.fixVersions(state.fixVersions, FixVersionActions.createDeserializeFixVersions(input['labels']))
        : initialFixVersionState;
      const customFieldState: CustomFieldState = input['custom'] ?
        reducers.customFields(state.customFields, CustomFieldActions.createDeserializeCustomFields(input['custom']))
        : initialCustomFieldState;

      // This will always be present
      const projectState: ProjectState =
        reducers.projects(state.projects, ProjectActions.createDeserializeProjects(input['projects']));
      const rankState: RankState =
        reducers.ranks(state.ranks, RankActions.createDeserializeRanks(input['projects']['main']));

      const lookupParams: DeserializeIssueLookupParams = new DeserializeIssueLookupParams()
        .setAssignees(assigneeState.assignees)
        .setPriorities(priorityState.priorities)
        .setIssueTypes(issueTypeState.types)
        .setComponents(componentState.components)
        .setLabels(labelState.labels)
        .setFixVersions(fixVersionState.versions)
        .setCustomFields(customFieldState.fields)
        .setBoardProjects(projectState.boardProjects)
        .setBoardStates(headers.states)
        .setParallelTasks(projectState.parallelTasks);

      const issueState: IssueState =
        reducers.issues(state.issues, IssueActions.createDeserializeIssuesAction(input['issues'], lookupParams));

      const blacklistState: BlacklistState =
        reducers.blacklist(state.blacklist, BlacklistActions.createDeserializeBlacklist(input['blacklist']));

      const newState: BoardState = {
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
        issues: issueState,
        ranks: rankState,
        blacklist: blacklistState
      };

      // Since BoardState is not an immutable Record it does not have the equals method so do some custom checking here.
      // It is not a record since I think the redux store cannot deal with 'parents' being immutable

      if (Map<any>(state).equals(Map<any>(newState))) {
        return state;
      }

      return newState;
    }
    // TODO the others
    default:
      return state;
  }
}

const getBoardState = (state: AppState) => state.board;

