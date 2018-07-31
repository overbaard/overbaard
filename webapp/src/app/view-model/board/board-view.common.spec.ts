import {List, Map} from 'immutable';
import {BehaviorSubject, Observable} from 'rxjs';
import {BoardViewModelHandler} from './board-view.service';
import {initialUserSettingState} from '../../model/board/user/user-setting.model';
import {BoardUtil, initialBoardState} from '../../model/board/data/board.model';
import {BoardState} from '../../model/board/data/board';
import {Dictionary} from '../../common/dictionary';
import {UserSettingActions, userSettingReducer} from '../../model/board/user/user-setting.reducer';
import {DeserializeIssueLookupParams, IssueState} from '../../model/board/data/issue/issue.model';
import {HeaderState} from '../../model/board/data/header/header.state';
import {BoardProject, LinkedProject, ParallelTask, ProjectState} from '../../model/board/data/project/project.model';
import {getTestIssueTypeState} from '../../model/board/data/issue-type/issue-type.reducer.spec';
import {getTestPriorityState} from '../../model/board/data/priority/priority.reducer.spec';
import {getTestAssigneeState} from '../../model/board/data/assignee/assignee.reducer.spec';
import {getTestFixVersionState} from 'app/model/board/data/fix-version/fix-version.reducer.spec';
import {getTestComponentState} from '../../model/board/data/component/component.reducer.spec';
import {getTestCustomFieldState} from '../../model/board/data/custom-field/custom-field.reducer.spec';
import {getTestLabelState} from '../../model/board/data/label/label.reducer.spec';
import {initialRankState, RankState} from '../../model/board/data/rank/rank.model';
import {RankActions, rankMetaReducer} from '../../model/board/data/rank/rank.reducer';
import {IssueActions, issueMetaReducer} from '../../model/board/data/issue/issue.reducer';
import {
  ASSIGNEE_ATTRIBUTES,
  COMPONENT_ATTRIBUTES,
  FilterAttributes,
  FilterAttributesUtil,
  FIX_VERSION_ATTRIBUTES,
  ISSUE_TYPE_ATTRIBUTES,
  LABEL_ATTRIBUTES,
  PARALLEL_TASK_ATTRIBUTES,
  PRIORITY_ATTRIBUTES,
  PROJECT_ATTRIBUTES,
} from '../../model/board/user/board-filter/board-filter.constants';
import {BoardFilterActions} from '../../model/board/user/board-filter/board-filter.reducer';
import {BoardViewModel} from './board-view';
import {BoardHeader} from './board-header';
import {UserSettingState} from '../../model/board/user/user-setting';
import {Action} from '@ngrx/store';
import {IssueSummaryLevel} from '../../model/board/user/issue-summary-level';
import {HeaderActions, headerMetaReducer} from '../../model/board/data/header/header.reducer';
import {cloneObject} from '../../common/object-util';
import {take} from 'rxjs/operators';
import {BoardIssue} from '../../model/board/data/issue/board-issue';

export class BoardViewObservableUtil {
  private _service: BoardViewModelHandler = new BoardViewModelHandler(null);
  private _userSettingState: UserSettingState = initialUserSettingState;
  private _userSettingSubject$: BehaviorSubject<UserSettingState> = new BehaviorSubject(initialUserSettingState);
  private _boardState: BoardState = initialBoardState;
  private _boardStateSubject$: BehaviorSubject<BoardState> = new BehaviorSubject(initialBoardState);
  private _boardView$: Observable<BoardViewModel>;


  constructor(userSettingQueryParams?: Dictionary<string>) {
    this._boardView$ = this._service.getBoardViewModel(this._boardStateSubject$, this._userSettingSubject$);
    if (!userSettingQueryParams) {
      userSettingQueryParams = {};
    }
    if (!userSettingQueryParams['board']) {
      userSettingQueryParams['board'] = 'Test';
    }
    this._userSettingState =
      userSettingReducer(this._userSettingState, UserSettingActions.createInitialiseFromQueryString(userSettingQueryParams));
    this._userSettingSubject$.next(this._userSettingState);
    this._userSettingSubject$
      .pipe(
        take(1)
      )
      .subscribe(table => {
      // Consume the initial event with the empty table
    });
  }

  get boardState(): BoardState {
    return this._boardState;
  }

  get userSettingState(): UserSettingState {
    return this._userSettingState;
  }

  updateBoardState(boardStateInitializer: BoardStateInitializer): BoardViewObservableUtil {
    boardStateInitializer.emitBoardChange(this);
    return this;
  }

  getBoardStateUpdater(): BoardStateUpdater {
    return new BoardStateUpdater(this);
  }

  getUserSettingUpdater(): UserSettingUpdater {
    return new UserSettingUpdater(this);
  }

  emitBoardState(boardState: BoardState): BoardViewObservableUtil {
    this._boardState = boardState;
    this._boardStateSubject$.next(this._boardState);
    return this;
  }

  emitUserSettingState(userSettingState: UserSettingState): BoardViewObservableUtil {
    this._userSettingState = userSettingState;
    this._userSettingSubject$.next(this._userSettingState);
    return this;
  }

  observer(): Observable<BoardViewModel> {
    return this._boardView$;
  }
}

export class BoardStateInitializer {
  private _issuesFactory: IssuesFactory;
  private _headerStateFactory: HeaderStateFactory;

  // Used to create the initial board
  private _rankedIssueKeys: any = {};
  private _stateMap: Dictionary<StateMapping[]> = {};
  private _issueTypeStateMap: Dictionary<Dictionary<StateMapping[]>> = {};

  constructor() {
  }

  issuesFactory(issuesFactory: IssuesFactory): BoardStateInitializer {
    this._issuesFactory = issuesFactory;
    return this;
  }

  headerStateFactory(headerStateFactory: HeaderStateFactory): BoardStateInitializer {
    this._headerStateFactory = headerStateFactory;
    return this;
  }

  setRank(projectKey: string, ...keys: number[]): BoardStateInitializer {
    this._rankedIssueKeys[projectKey] = {};
    this._rankedIssueKeys[projectKey]['ranked'] = keys.map(v => projectKey + '-' + v);
    return this;
  }

  mapState(projectKey: string, boardState: string, ownState: string): BoardStateInitializer {
    let projectMap: StateMapping[] = this._stateMap[projectKey];
    if (!projectMap) {
      projectMap = [];
      this._stateMap[projectKey] = projectMap;
    }
    projectMap.push(new StateMapping(boardState, ownState));
    return this;
  }

  mapIssueTypeState(projectKey: string, issueType: string, boardState: string, ownState: string) {
    expect(this._stateMap[projectKey]).toBeTruthy('Adding a state override for an issue type for a project that has not been configured');
    let projectMap: Dictionary<StateMapping[]> = this._issueTypeStateMap[projectKey];
    if (!projectMap) {
      projectMap = {};
      this._issueTypeStateMap[projectKey] = projectMap;
    }
    let mapping: StateMapping[] = projectMap[issueType];
    if (!mapping) {
      mapping = [];
      projectMap[issueType] = mapping;
    }
    mapping.push(new StateMapping(boardState, ownState));
    return this;
  }

  // Internal use only
  emitBoardChange(mainUtil: BoardViewObservableUtil): void {
    const headerState: HeaderState = this._headerStateFactory.createHeaderState(mainUtil.boardState.headers);
    const projectState: ProjectState = this.createProjectState();
    const boardState: BoardState = BoardUtil.withMutations(mainUtil.boardState, mutable => {
      mutable.viewId = 1;
      mutable.headers = headerState;
      mutable.projects = projectState;
      mutable.issueTypes = getTestIssueTypeState();
      mutable.priorities = getTestPriorityState();
      mutable.assignees = getTestAssigneeState();
      mutable.components = getTestComponentState();
      mutable.fixVersions = getTestFixVersionState();
      mutable.labels = getTestLabelState();
      mutable.customFields = getTestCustomFieldState();
      mutable.ranks = this.createRankState();
      mutable.issues = this.createIssueState(mainUtil.boardState, getDeserializeIssueLookupParams(headerState, projectState));
    });
    mainUtil.emitBoardState(boardState);
  }

  private createProjectState(): ProjectState {
    const projects: Map<string, BoardProject> = Map<string, BoardProject>().withMutations(projectMap => {
      if (Object.keys(this._stateMap).length === 0) {
        // Add an empty owner project for tests that are not really concerned with issues
        this._stateMap['xxx'] = new Array<StateMapping>();
      }

      for (const projectKey of Object.keys(this._stateMap)) {
        const stateMap: Map<string, string> = Map<string, string>().withMutations(states => {
          for (const mapping of this._stateMap[projectKey]) {
            states.set(mapping.board, mapping.own);
          }
        });

        const issueTypeStatesMap: Map<string, Map<string, string>> = Map<string, Map<string, string>>().withMutations(issueTypeStates => {
          const projectIssueStateOverrides: Dictionary<StateMapping[]> = this._issueTypeStateMap[projectKey];
          if (projectIssueStateOverrides) {
            for (const issueTypeName of Object.keys(projectIssueStateOverrides)) {
              const typeStatesMap: Map<string, string> = Map<string, string>().withMutations(typeStates => {
                for (const mapping of projectIssueStateOverrides[issueTypeName]) {
                  typeStates.set(mapping.board, mapping.own);
                }
              });
              issueTypeStates.set(issueTypeName, typeStatesMap);
            }
          }
        });

        const project: BoardProject = {
          key: projectKey,
          colour: 'red',
          canRank: false,
          parallelTasks: List<List<ParallelTask>>(),
          parallelTaskIssueTypeOverrides: Map<string, List<List<ParallelTask>>>(),
          boardStateNameToOwnStateName: stateMap,
          boardStateNameToOwnStateNameIssueTypeOverrides: issueTypeStatesMap
        };
        projectMap.set(projectKey, project);
      }
    });

    return {
      boardProjects: projects,
      linkedProjects: Map<string, LinkedProject>()
    };
  }

  private createRankState(): RankState {
    const projectsWithRankedKeys: any = [];
    for (const key of Object.keys(this._rankedIssueKeys)) {
      const project: any = cloneObject(this._rankedIssueKeys[key]);
      project['code'] = key;
      projectsWithRankedKeys.push(project);
    }
    return rankMetaReducer(initialRankState, RankActions.createDeserializeRanks(projectsWithRankedKeys));
  }

  private createIssueState(boardState: BoardState, params: DeserializeIssueLookupParams): IssueState {
    const input: any = this._issuesFactory.createIssueStateInput(params);
    this._issuesFactory.clear();
    return issueMetaReducer(
      boardState.issues,
      IssueActions.createDeserializeIssuesAction(input, params));
  }
}

export class BoardStateUpdater {
  private _issueChanges: any;
  private _rankChanges: any;
  private _rankDeleted: string[];
  private _helpTexts: any;

  constructor(private _mainUtil: BoardViewObservableUtil) {
  }

  issueChanges(input: any): BoardStateUpdater {
    // Can only do this when updating
    expect(this._mainUtil.boardState.viewId).toBeGreaterThan(-1);
    this._issueChanges = input;
    if (input && input['delete']) {
      this._rankDeleted = input['delete'];
    }
    return this;
  }

  rankChanges(input: any): BoardStateUpdater {
    // Can only do this when updating
    expect(this._mainUtil.boardState.viewId).toBeGreaterThan(-1);
    this._rankChanges = input;
    return this;
  }

  setHelpTexts(input: any): BoardStateUpdater {
    expect(this._mainUtil.boardState.viewId).toBeGreaterThan(-1);
    this._helpTexts = input;
    return this;
  }

  emit(): BoardViewObservableUtil {

    const boardState: BoardState = BoardUtil.withMutations(this._mainUtil.boardState, mutable => {
      if (this._issueChanges || this._rankChanges || this._rankDeleted) {
        // Don't bump the view id when we add the help texts
        mutable.viewId = mutable.viewId + 1;

        const currentIssues: Map<string, BoardIssue> = this._mainUtil.boardState.issues.issues;

        mutable.issues = issueMetaReducer(
          this._mainUtil.boardState.issues,
          IssueActions.createChangeIssuesAction(
            this._issueChanges ? this._issueChanges : {},
            currentIssues,
            getDeserializeIssueLookupParams(this._mainUtil.boardState.headers, this._mainUtil.boardState.projects)));
        if (this._rankChanges || this._rankDeleted) {
          mutable.ranks = rankMetaReducer(
            this._mainUtil.boardState.ranks,
            RankActions.createRerank(this._rankChanges, this._rankDeleted));
        }
      } else if (this._helpTexts) {
        mutable.headers = headerMetaReducer(mutable.headers, HeaderActions.createLoadHelpTexts(this._helpTexts));
      }
    });
    return this._mainUtil.emitBoardState(boardState);
  }
}

export class UserSettingUpdater {
  constructor(private _mainUtil: BoardViewObservableUtil) {
  }

  updateSwimlane(swimlane: string): BoardViewObservableUtil {
    return this.emitState(UserSettingActions.createUpdateSwimlane(swimlane));
  }

  updateFilters(name: string, ...keys: string[]): BoardViewObservableUtil {
    let atributes: FilterAttributes;
    switch (name) {
      case PROJECT_ATTRIBUTES.key:
        atributes = PROJECT_ATTRIBUTES;
        break;
      case ISSUE_TYPE_ATTRIBUTES.key:
        atributes = ISSUE_TYPE_ATTRIBUTES;
        break;
      case PRIORITY_ATTRIBUTES.key:
        atributes = PRIORITY_ATTRIBUTES;
        break;
      case ASSIGNEE_ATTRIBUTES.key:
        atributes = ASSIGNEE_ATTRIBUTES;
        break;
      case COMPONENT_ATTRIBUTES.key:
        atributes = COMPONENT_ATTRIBUTES;
        break;
      case LABEL_ATTRIBUTES.key:
        atributes = LABEL_ATTRIBUTES;
        break;
      case FIX_VERSION_ATTRIBUTES.key:
        atributes = FIX_VERSION_ATTRIBUTES;
        break;
      case PARALLEL_TASK_ATTRIBUTES.key:
        // TODO implement another way if we need this
        throw new Error('Parallel Task filters cannot be changed using this method');
      // atributes = PARALLEL_TASK_ATTRIBUTES;
    }
    let values: object = null;
    if (atributes) {
      values = {};
      for (const key of keys) {
        values[key] = true;
      }
    } else {
      if (this._mainUtil.boardState.customFields.fields.get(name)) {
        atributes = FilterAttributesUtil.createCustomFieldFilterAttributes(name);
        values = {};
        for (const key of keys) {
          values[key] = true;
        }
      }
    }

    expect(values).toBeTruthy();
    return this.emitState(BoardFilterActions.createUpdateFilter(atributes, values));
  }

  toggleBacklog(): BoardViewObservableUtil {
    this._mainUtil.observer()
      .pipe(
        take(1)
      )
      .subscribe(boardView => {
        const backlogHeader: BoardHeader = boardView.headers.headersList.get(0);
            expect(backlogHeader.backlog).toBe(true);

        return this.emitState(UserSettingActions.createToggleBacklog(backlogHeader));
      });

    return this._mainUtil;
  }

  switchViewMode(): BoardViewObservableUtil {
    return this.emitState(UserSettingActions.createSwitchBoardViewAction());
  }

  updateVisibility(newValue: boolean, ...stateIndices: number[]): BoardViewObservableUtil {
    return this.emitState(UserSettingActions.createToggleVisibility(newValue, List<number>(stateIndices)));
  }

  toggleShowEmptySwimlanes(): BoardViewObservableUtil {
    return this.emitState(UserSettingActions.createToggleShowEmptySwimlanes());
  }

  toggleCollapsedSwimlane(key: string): BoardViewObservableUtil {
    return this.emitState(UserSettingActions.createToggleCollapsedSwimlane(key));
  }

  updateIssueSummaryLevel(level: IssueSummaryLevel): BoardViewObservableUtil {
    return this.emitState(UserSettingActions.createUpdateIssueSummaryLevel(level));
  }

  private emitState(action: Action): BoardViewObservableUtil {
    const userSettingState: UserSettingState = userSettingReducer(this._mainUtil.userSettingState, action);
    return this._mainUtil.emitUserSettingState(userSettingState);
  }
}

function getDeserializeIssueLookupParams(headerState: HeaderState, projectState: ProjectState): DeserializeIssueLookupParams {
  return new DeserializeIssueLookupParams()
    .setBoardStates(headerState.states)
    .setIssueTypes(getTestIssueTypeState().types)
    .setPriorities(getTestPriorityState().priorities)
    .setBoardProjects(projectState.boardProjects)
    .setAssignees(getTestAssigneeState().assignees)
    .setComponents(getTestComponentState().components)
    .setFixVersions(getTestFixVersionState().versions)
    .setLabels(getTestLabelState().labels)
    .setCustomFields(getTestCustomFieldState().fields);
}

class StateMapping {
  constructor(public board, public own) {
  }
}

export interface IssuesFactory {
  clear();
  createIssueStateInput(params: DeserializeIssueLookupParams): any;
}

export interface HeaderStateFactory {
  createHeaderState(currentState: HeaderState): HeaderState;
}
