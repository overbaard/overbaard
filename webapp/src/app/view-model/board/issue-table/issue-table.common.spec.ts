import {List, Map} from 'immutable';
import {IssueTable} from './issue-table';
import {HeaderState} from '../../../model/board/data/header/header.state';
import {DeserializeIssueLookupParams, initialIssueState, IssueState} from '../../../model/board/data/issue/issue.model';
import {BoardProject, LinkedProject, ParallelTask, ProjectState} from '../../../model/board/data/project/project.model';
import {initialRankState, RankState} from '../../../model/board/data/rank/rank.model';
import {BehaviorSubject} from 'rxjs/BehaviorSubject';
import {BoardUtil, initialBoardState} from '../../../model/board/data/board.model';
import {BoardState} from '../../../model/board/data/board';
import {HeaderActions, headerMetaReducer} from '../../../model/board/data/header/header.reducer';
import {initialHeaderState} from '../../../model/board/data/header/header.model';
import {IssueActions, issueMetaReducer} from '../../../model/board/data/issue/issue.reducer';
import {RankActions, rankMetaReducer} from '../../../model/board/data/rank/rank.reducer';
import {getTestIssueTypeState} from '../../../model/board/data/issue-type/issue-type.reducer.spec';
import {getTestPriorityState} from '../../../model/board/data/priority/priority.reducer.spec';
import {getTestAssigneeState} from '../../../model/board/data/assignee/assignee.reducer.spec';
import {IssueTableHandler} from './issue-table.service';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/take';
import {initialUserSettingState, UserSettingState} from '../../../model/board/user/user-setting.model';
import {Dictionary} from '../../../common/dictionary';
import {UserSettingActions, userSettingReducer} from '../../../model/board/user/user-setting.reducer';
import {getTestComponentState} from '../../../model/board/data/component/component.reducer.spec';
import {getTestFixVersionState} from '../../../model/board/data/fix-version/fix-version.reducer.spec';
import {getTestLabelState} from '../../../model/board/data/label/label.reducer.spec';
import {getTestCustomFieldState} from '../../../model/board/data/custom-field/custom-field.reducer.spec';

export class IssueTableObservableUtil {
  private _rankedIssueKeys: any = {};
  private _stateMap: Map<string, StateMapping[]> = Map<string, StateMapping[]>();

  private _service: IssueTableHandler = new IssueTableHandler();
  private _userSettingState: UserSettingState = initialUserSettingState;
  private _boardState: BoardState = initialBoardState;
  private _boardStateSubject$: BehaviorSubject<BoardState> = new BehaviorSubject(initialBoardState);
  private _userSettingSubject$: BehaviorSubject<UserSettingState> = new BehaviorSubject(initialUserSettingState);
  private _issueTable$: Observable<IssueTable>;

  // Used for the update tests
  private _issueChanges: any;
  private _rankChanges: any;
  private _rankDeleted: string[];

  constructor(private _owner: string, private _issuesFactory: IssuesFactory,
              private _numberStates: number, userSettingQueryParams?: Dictionary<string>) {
    this._issueTable$ = this._service.getIssueTable(this._boardStateSubject$, this._userSettingSubject$);
    if (userSettingQueryParams) {
      this.updateUserSettings(userSettingQueryParams);
      this._userSettingSubject$.take(1).subscribe(table => {
        // Consume the initial event with the empty table
      });
    }
  }

  setRank(projectKey: string, ...keys: number[]): IssueTableObservableUtil {
    this._rankedIssueKeys[projectKey] = {};
    this._rankedIssueKeys[projectKey]['ranked'] = keys.map(v => projectKey + '-' + v);
    return this;
  }

  mapState(projectKey: string, boardState: string, ownState: string): IssueTableObservableUtil {
    let projectMap: StateMapping[] = this._stateMap.get(projectKey);
    if (!projectMap) {
      projectMap = [];
      this._stateMap = this._stateMap.set(projectKey, projectMap);
    }
    projectMap.push(new StateMapping(boardState, ownState));
    return this;
  }

  issueChanges(input: any): IssueTableObservableUtil {
    // Can only do this when updating
    expect(this._boardState.viewId).toBeGreaterThan(-1);
    this._issueChanges = input;
    if (input && input['delete']) {
      this._rankDeleted = input['delete']
    }
    return this;
  }

  rankChanges(input: any): IssueTableObservableUtil {
    // Can only do this when updating
    expect(this._boardState.viewId).toBeGreaterThan(-1);
    this._rankChanges = input;
    return this;
  }

  emitBoardChange(): IssueTableObservableUtil {
    if (this._boardState.viewId === -1) {
      const headerState: HeaderState = this.createHeaderState();
      const projectState: ProjectState = this.createProjectState();
      this._boardState = BoardUtil.toStateRecord(this._boardState).withMutations(mutable => {
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
        mutable.issues = this.createIssueState(this.getDeserializeIssueLookupParams(headerState, projectState));
      });
    } else {
      this._boardState = BoardUtil.toStateRecord(this._boardState).withMutations(mutable => {
        mutable.viewId = mutable.viewId + 1;
        mutable.issues = issueMetaReducer(
          this._boardState.issues,
          IssueActions.createChangeIssuesAction(
            this._issueChanges ? this._issueChanges : {},
            this.getDeserializeIssueLookupParams(this._boardState.headers, this._boardState.projects)));
        if (this._rankChanges || this._rankDeleted) {
          mutable.ranks = rankMetaReducer(
            this._boardState.ranks,
            RankActions.createRerank(this._rankChanges, this._rankDeleted));
        }
      });
    }
    this._rankChanges = null;
    this._rankDeleted = null;
    this._issueChanges = null;

    this._boardStateSubject$.next(this._boardState);
    return this;
  }

  updateUserSettings(userSettingQueryParams?: Dictionary<string>) {
    this._userSettingState =
      userSettingReducer(this._userSettingState, UserSettingActions.createInitialiseFromQueryString(userSettingQueryParams));
    this._userSettingSubject$.next(this._userSettingState);
  }

  tableObserver(): Observable<IssueTable> {
    return this._issueTable$;
  }

  getDeserializeIssueLookupParams(headerState: HeaderState, projectState: ProjectState): DeserializeIssueLookupParams {
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

  private createHeaderState(): HeaderState {
    const input: any[] = new Array<any>();
    for (let i = 1 ; i <= this._numberStates ; i++) {
      input.push({name: 'S-' + i});
    }
    return headerMetaReducer(
      initialHeaderState,
      HeaderActions.createDeserializeHeaders(input, [], 0, 0));
  }

  private createIssueState(params: DeserializeIssueLookupParams): IssueState {
    const input: any = this._issuesFactory.createIssueStateInput(params);
    this._issuesFactory.clear()
    return issueMetaReducer(
      initialIssueState,
      IssueActions.createDeserializeIssuesAction(input, params));
  }

  private createProjectState(): ProjectState {
    const projects: Map<string, BoardProject> = Map<string, BoardProject>().withMutations(projectMap => {
      this._stateMap.forEach((mappings, projectKey) => {
        const stateMap: Map<string, string> = Map<string, string>().withMutations(states => {
          for (const mapping of mappings) {
            states.set(mapping.board, mapping.own);
          }
        });
        const project: BoardProject = {
          key: projectKey,
          colour: 'red',
          canRank: false,
          boardStateNameToOwnStateName: stateMap
        };
        projectMap.set(projectKey, project);
      });
    });

    return {
      owner: this._owner,
      boardProjects: projects,
      linkedProjects: Map<string, LinkedProject>(),
      parallelTasks: Map<string, List<ParallelTask>>()
    };
  }

  private createRankState(): RankState {
    return rankMetaReducer(initialRankState, RankActions.createDeserializeRanks(this._rankedIssueKeys));
  }
}

class StateMapping {

  constructor(public board, public own) {
  }
}

export interface IssuesFactory {
  clear();
  createIssueStateInput(params: DeserializeIssueLookupParams): any;
}

