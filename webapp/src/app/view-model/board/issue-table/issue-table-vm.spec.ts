import {List, Map, OrderedSet} from 'immutable';
import {BoardIssue} from '../../../model/board/data/issue/board-issue';
import {IssueTableVm} from './issue-table-vm';
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
import {IssueTableVmHandler} from './issue-table-vm.service';
import {Observable} from 'rxjs/Observable';
import 'rxjs/add/operator/take';
import {initialUserSettingState, UserSettingState} from '../../../model/board/user/user-setting.model';


describe('Issue Table observer tests', () => {

  describe('Create tests', () => {
    describe('One project issues', () => {
      it('All states mapped, issues in all states', () => {
        const observable: Observable<IssueTableVm> = new IssueTableObservableUtil('ONE', 4)
          .addIssue('ONE-1', 0)
          .addIssue('ONE-2', 1)
          .addIssue('ONE-3', 2)
          .addIssue('ONE-4', 3)
          .addIssue('ONE-5', 2)
          .addIssue('ONE-6', 2)
          .setRank('ONE', 5, 1, 2, 3, 4, 6)
          .mapState('ONE', 'S-1', '1-1')
          .mapState('ONE', 'S-2', '1-2')
          .mapState('ONE', 'S-3', '1-3')
          .mapState('ONE', 'S-4', '1-4')
          .emit();

        observable.subscribe(
          issueTable => checkTable(issueTable.table,
            [['ONE-1'], ['ONE-2'], ['ONE-5', 'ONE-3', 'ONE-6'], ['ONE-4']]));
      });
      it('All states mapped, issues in some states', () => {
        const observable: Observable<IssueTableVm> = new IssueTableObservableUtil('ONE', 4)
          .addIssue('ONE-1', 1)
          .addIssue('ONE-2', 1)
          .addIssue('ONE-3', 2)
          .addIssue('ONE-4', 3)
          .addIssue('ONE-5', 2)
          .setRank('ONE', 5, 1, 2, 3, 4)
          .mapState('ONE', 'S-1', '1-1')
          .mapState('ONE', 'S-2', '1-2')
          .mapState('ONE', 'S-3', '1-3')
          .mapState('ONE', 'S-4', '1-4')
          .emit();

        observable.subscribe(
          issueTable => checkTable(issueTable.table,
            [[], ['ONE-1', 'ONE-2'], ['ONE-5', 'ONE-3'], ['ONE-4']]));
      });

      it('Not all states mapped, issues in all states', () => {
        const observable: Observable<IssueTableVm> = new IssueTableObservableUtil('ONE', 4)
          .addIssue('ONE-1', 0)
          .addIssue('ONE-2', 0)
          .addIssue('ONE-3', 1)
          .addIssue('ONE-4', 1)
          .setRank('ONE', 4, 3, 2, 1)
          .mapState('ONE', 'S-2', '1-1')
          .mapState('ONE', 'S-4', '1-2')
          .emit();

        observable.subscribe(
          issueTable => checkTable(issueTable.table,
            [[], ['ONE-2', 'ONE-1'], [], ['ONE-4', 'ONE-3']]));
      });
    });

    describe('Two project issues', () => {
      it('All states mapped, issues in all states', () => {
        const observable: Observable<IssueTableVm> = new IssueTableObservableUtil('ONE', 4)
          .addIssue('ONE-1', 0)
          .addIssue('ONE-2', 1)
          .addIssue('ONE-3', 2)
          .addIssue('ONE-4', 3)
          .addIssue('ONE-5', 2)
          .addIssue('ONE-6', 2)
          .setRank('ONE', 1, 2, 3, 4, 5, 6)
          .mapState('ONE', 'S-1', '1-1')
          .mapState('ONE', 'S-2', '1-2')
          .mapState('ONE', 'S-3', '1-3')
          .mapState('ONE', 'S-4', '1-4')
          .addIssue('TWO-1', 0)
          .addIssue('TWO-2', 1)
          .addIssue('TWO-3', 2)
          .addIssue('TWO-4', 3)
          .addIssue('TWO-5', 2)
          .addIssue('TWO-6', 2)
          .setRank('TWO', 6, 5, 4, 3, 2, 1)
          .mapState('TWO', 'S-1', '2-1')
          .mapState('TWO', 'S-2', '2-2')
          .mapState('TWO', 'S-3', '2-3')
          .mapState('TWO', 'S-4', '2-4')

          .emit();

        observable.subscribe(
          issueTable => checkTable(issueTable.table,
            [
              ['ONE-1', 'TWO-1'],
              ['ONE-2', 'TWO-2'],
              ['ONE-3', 'ONE-5', 'ONE-6', 'TWO-6', 'TWO-5', 'TWO-3'],
              ['ONE-4', 'TWO-4']]));
      });

      it('Not all states mapped, issues in all states', () => {
        const observable: Observable<IssueTableVm> = new IssueTableObservableUtil('ONE', 5)
          .addIssue('ONE-1', 0)
          .addIssue('ONE-2', 0)
          .addIssue('ONE-3', 1)
          .setRank('ONE', 3, 2, 1)
          .mapState('ONE', 'S-2', '1-1')
          .mapState('ONE', 'S-3', '1-2')
          .addIssue('TWO-1', 0)
          .addIssue('TWO-2', 1)
          .addIssue('TWO-3', 1)
          .setRank('TWO', 3, 2, 1)
          .mapState('TWO', 'S-3', '2-1')
          .mapState('TWO', 'S-4', '2-2')

          .emit();

        observable.subscribe(
          issueTable => checkTable(issueTable.table,
            [
              [],
              ['ONE-2', 'ONE-1'],
              ['ONE-3', 'TWO-1'],
              ['TWO-3', 'TWO-2'],
              []]));
      });
    });
  });

  describe('Update tests', () => {
    let util: IssueTableObservableUtil;
    let original: IssueTableVm;
    beforeEach(() => {
      util = new IssueTableObservableUtil('ONE', 4)
        .addIssue('ONE-1', 0)
        .addIssue('ONE-2', 1)
        .addIssue('ONE-3', 2)
        .addIssue('ONE-4', 3)
        .addIssue('ONE-5', 2)
        .addIssue('ONE-6', 2)
        .addIssue('ONE-7', 3)
        .setRank('ONE', 1, 2, 3, 4, 5, 6, 7)
        .mapState('ONE', 'S-1', '1-1')
        .mapState('ONE', 'S-2', '1-2')
        .mapState('ONE', 'S-3', '1-3')
        .mapState('ONE', 'S-4', '1-4');
      util.emit()
        .take(1)
        .subscribe(
        issueTable => {
          checkTable(issueTable.table,
            [['ONE-1'], ['ONE-2'], ['ONE-3', 'ONE-5', 'ONE-6'], ['ONE-4', 'ONE-7']])
          original = issueTable;
        });
    });

    it( 'Update issue detail', () => {
      util
        .issueChanges({update: [{key: 'ONE-2', summary: 'Test summary'}]})
        .emit()
        .subscribe(
        issueTable => {
          checkTable(issueTable.table,
            [['ONE-1'], ['ONE-2'], ['ONE-3', 'ONE-5', 'ONE-6'], ['ONE-4', 'ONE-7']]);
          expect(issueTable.table).toBe(original.table)
        });
    });

    it ('Update issue state', () => {
      util
        .issueChanges({update: [{key: 'ONE-5', state: '1-2'}]})
        .emit()
        .subscribe(
          issueTable => {
            checkTable(issueTable.table,
              [['ONE-1'], ['ONE-2', 'ONE-5'], ['ONE-3', 'ONE-6'], ['ONE-4', 'ONE-7']]);
            checkSameColumns(original, issueTable, 0, 3);
          });
    });

    it ('Delete issue', () => {
      util
        .issueChanges({delete: ['ONE-5']})
        .emit()
        .subscribe(
          issueTable => {
            checkTable(issueTable.table,
              [['ONE-1'], ['ONE-2'], ['ONE-3', 'ONE-6'], ['ONE-4', 'ONE-7']]);
            checkSameColumns(original, issueTable, 0, 1, 3);
          });

    });

    it ('New issue', () => {
      util
        .issueChanges({new: [{key: 'ONE-8', state: '1-1', summary: 'Test', priority: 0, type: 0}]})
        .rankChanges({ONE: [{index: 7, key: 'ONE-8'}]})
        .emit()
        .subscribe(
          issueTable => {
            checkTable(issueTable.table,
              [['ONE-1', 'ONE-8'], ['ONE-2'], ['ONE-3', 'ONE-5', 'ONE-6'], ['ONE-4', 'ONE-7']]);
            checkSameColumns(original, issueTable, 1, 2, 3);
          });
    });

    it ('Rerank issue - no effect on existing states', () => {
      util
        .rankChanges({ONE: [{index: 0, key: 'ONE-3'}]})
        .emit()
        .subscribe(
          issueTable => {
            checkTable(issueTable.table,
              [['ONE-1'], ['ONE-2'], ['ONE-3', 'ONE-5', 'ONE-6'], ['ONE-4', 'ONE-7']]);
            expect(issueTable).toBe(original);
          });

    });


    it ('Rerank issue - effect on existing states', () => {
      util
        .issueChanges({new: [{key: 'ONE-8', state: '1-1', summary: 'Test', priority: 0, type: 0}]})
        .rankChanges({ONE: [{index: 6, key: 'ONE-3'}]})
        .emit()
        .subscribe(
          issueTable => {
            checkTable(issueTable.table,
              [['ONE-1'], ['ONE-2'], ['ONE-5', 'ONE-6', 'ONE-3'], ['ONE-4', 'ONE-7']]);
            checkSameColumns(original, issueTable, 0, 1, 3);
          });
    });
  });
});

export function checkTable(table: List<List<string>>, expected: string[][]) {
  const actualTable: string[][] = [];
  table.forEach((v, i) => {
    actualTable.push(table.get(i).toArray());
  });
  expect(actualTable).toEqual(expected);
}

function checkSameColumns(oldState: IssueTableVm, newState: IssueTableVm, ...cols: number[]) {
  const expectedEqual: OrderedSet<number> = OrderedSet<number>(cols);
  expect(oldState.table.size).toBe(newState.table.size);
  for (let i = 0 ; i < oldState.table.size ; i++) {
    const oldCol: List<string> = oldState.table.get(i);
    const newCol: List<string> = newState.table.get(i);
    if (expectedEqual.contains(i)) {
      expect(oldCol).toBe(newCol, 'Column ' + i);
    } else {
      expect(oldCol).not.toBe(newCol, 'Column ' + i);
    }
  }
}


class IssueTableObservableUtil {
  _issueKeys: string[] = [];
  _issueStates: number[] = [];
  _rankedIssueKeys: any = {};
  _stateMap: Map<string, StateMapping[]> = Map<string, StateMapping[]>();

  _service: IssueTableVmHandler = new IssueTableVmHandler();
  _boardState: BoardState = initialBoardState;
  _boardStateSubject$: BehaviorSubject<BoardState> = new BehaviorSubject(initialBoardState);
  _userSettingSubject$: BehaviorSubject<UserSettingState> = new BehaviorSubject(initialUserSettingState);
  _issueTableVm$: Observable<IssueTableVm>;

  // Used for the update tests
  private _issueChanges: any;
  private _rankChanges: any;
  private _rankDeleted: string[];

  constructor(private _owner: string, private _numberStates: number) {
    this._issueTableVm$ = this._service.getIssueTableVm(this._boardStateSubject$, this._userSettingSubject$);
  }

  addIssue(key: string, state: number): IssueTableObservableUtil {
    this._issueKeys.push(key);
    this._issueStates.push(state);
    return this;
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


  emit(): Observable<IssueTableVm> {
    if (this._boardState.viewId === -1) {
      const headerState: HeaderState = this.createHeaderState();
      const projectState: ProjectState = this.createProjectState();
      this._boardState = BoardUtil.toStateRecord(this._boardState).withMutations(mutable => {
        mutable.viewId = 1;
        mutable.headers = headerState;
        mutable.projects = projectState;
        mutable.ranks = this.createRankState();
        mutable.issues = this.createIssueState(this.getDeserializeIssueLookupParams(headerState, projectState));
      });
    } else {
      this._boardState = BoardUtil.toStateRecord(this._boardState).withMutations(mutable => {
        mutable.viewId = mutable.viewId + 1;
        if (this._issueChanges) {
          mutable.issues = issueMetaReducer(
            this._boardState.issues,
            IssueActions.createChangeIssuesAction(
              this._issueChanges,
              this.getDeserializeIssueLookupParams(this._boardState.headers, this._boardState.projects)));
          this._issueChanges = null;
        }
        if (this._rankChanges || this._rankDeleted) {
          mutable.ranks = rankMetaReducer(
            this._boardState.ranks,
            RankActions.createRerank(this._rankChanges, this._rankDeleted));
          this._rankChanges = null;
          this._rankDeleted = null;
        }
      });
    }
    this._boardStateSubject$.next(this._boardState);
    return this._issueTableVm$;
  }

  getDeserializeIssueLookupParams(headerState: HeaderState, projectState: ProjectState): DeserializeIssueLookupParams {
    return new DeserializeIssueLookupParams()
      .setBoardStates(headerState.states)
      .setIssueTypes(getTestIssueTypeState().types)
      .setPriorities(getTestPriorityState().priorities)
      .setBoardProjects(projectState.boardProjects)
      .setAssignees(getTestAssigneeState().assignees);
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
    const input: any = {};
    for (let i = 0 ; i < this._issueKeys.length ; i++) {
      input[this._issueKeys[i]] = {
        key: this._issueKeys[i],
        type: 1,
        priority: 1,
        summary: '-',
        state: this._issueStates[i]
      };
    }
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


