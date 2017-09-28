import {HeaderState, initialHeaderState} from '../../header/header.model';
import {HeaderActions, headerReducer} from '../../header/header.reducer';
import {BoardIssue, DeserializeIssueLookupParams, initialIssueState, IssueState} from '../../issue/issue.model';
import {List, Map, OrderedSet} from 'immutable';
import {BoardProject, LinkedProject, ParallelTask, ProjectState} from '../../project/project.model';
import {initialIssueTableState, IssueTableState} from './issue-table.model';
import {IssueTableActions, issueTableReducer} from './issue-table.reducer';
import {initialRankState, RankState} from '../../rank/rank.model';
import {IssueActions, issueReducer} from '../../issue/issue.reducer';
import {Action} from '@ngrx/store';
import {getTestPriorityState} from '../../priority/priority.reducer.spec';
import {getTestIssueTypeState} from '../../issue-type/issue-type.reducer.spec';
import {getTestAssigneeState} from '../../assignee/assignee.reducer.spec';
import {RankActions, rankReducer} from '../../rank/rank.reducer';

describe('Issue Table reducer tests', () => {

  describe('Create tests', () => {
    describe('One project issues', () => {
      it('All states mapped, issues in all states', () => {
        const issueTableState: IssueTableState = new CreateIssueTableBuilder('ONE', 4)
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
          .build();

        checkTable(issueTableState.table,
          [['ONE-1'], ['ONE-2'], ['ONE-5', 'ONE-3', 'ONE-6'], ['ONE-4']]);
      });
      it('All states mapped, issues in some states', () => {
        const issueTableState: IssueTableState = new CreateIssueTableBuilder('ONE', 4)
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
          .build();

        checkTable(issueTableState.table,
          [[], ['ONE-1', 'ONE-2'], ['ONE-5', 'ONE-3'], ['ONE-4']]);
      });
      it('Not all states mapped, issues in all states', () => {
        const issueTableState: IssueTableState = new CreateIssueTableBuilder('ONE', 4)
          .addIssue('ONE-1', 0)
          .addIssue('ONE-2', 0)
          .addIssue('ONE-3', 1)
          .addIssue('ONE-4', 1)
          .setRank('ONE', 4, 3, 2, 1)
          .mapState('ONE', 'S-2', '1-1')
          .mapState('ONE', 'S-4', '1-2')
          .build();

        checkTable(issueTableState.table,
          [[], ['ONE-2', 'ONE-1'], [], ['ONE-4', 'ONE-3']]);
      });
    });

    describe('Two project issues', () => {
      it('All states mapped, issues in all states', () => {
        const issueTableState: IssueTableState = new CreateIssueTableBuilder('ONE', 4)
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

          .build();

        checkTable(issueTableState.table,
          [
            ['ONE-1', 'TWO-1'],
            ['ONE-2', 'TWO-2'],
            ['ONE-3', 'ONE-5', 'ONE-6', 'TWO-6', 'TWO-5', 'TWO-3'],
            ['ONE-4', 'TWO-4']]);
      });

      it('Not all states mapped, issues in all states', () => {
        const issueTableState: IssueTableState = new CreateIssueTableBuilder('ONE', 5)
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

          .build();

        checkTable(issueTableState.table,
          [
            [],
            ['ONE-2', 'ONE-1'],
            ['ONE-3', 'TWO-1'],
            ['TWO-3', 'TWO-2'],
            []]);
      });
    });
  });

  describe('Update tests', () => {
    let builder: CreateIssueTableBuilder;
    let state: IssueTableState;
    beforeEach(() => {
      builder = new CreateIssueTableBuilder('ONE', 4)
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
      state = builder.build();

      checkTable(state.table,
        [['ONE-1'], ['ONE-2'], ['ONE-3', 'ONE-5', 'ONE-6'], ['ONE-4', 'ONE-7']]);
    });

    it( 'Update issue detail', () => {
      const issueState: IssueState = issueReducer(
        builder.issueState,
        IssueActions.createChangeIssuesAction({update: [{key: 'ONE-2', summary: 'Test summary'}]},
          builder.getDeserializeIssueLookupParams()));
      const newState = issueTableReducer(state, new UpdateActionCreator(builder).issue(issueState).build());

      checkTable(newState.table,
        [['ONE-1'], ['ONE-2'], ['ONE-3', 'ONE-5', 'ONE-6'], ['ONE-4', 'ONE-7']]);
      checkSameColumns(state, newState, 0, 2, 3);
    });

    it ('Update issue state', () => {
      const issueState: IssueState = issueReducer(
        builder.issueState,
        IssueActions.createChangeIssuesAction({update: [{key: 'ONE-5', state: '1-2'}]},
          builder.getDeserializeIssueLookupParams()));
      const newState = issueTableReducer(state, new UpdateActionCreator(builder).issue(issueState).build());

      checkTable(newState.table,
        [['ONE-1'], ['ONE-2', 'ONE-5'], ['ONE-3', 'ONE-6'], ['ONE-4', 'ONE-7']]);
      checkSameColumns(state, newState, 0, 3);
    });

    it ('Delete issue', () => {
      const issueState: IssueState = issueReducer(
        builder.issueState,
        IssueActions.createChangeIssuesAction({delete: ['ONE-5']},
          builder.getDeserializeIssueLookupParams()));
      const rankState: RankState = rankReducer(
        builder.rankState,
        RankActions.createRerank(null, ['ONE-5']));
      const newState = issueTableReducer(
        state,
        new UpdateActionCreator(builder).issue(issueState).rank(rankState).build());

      checkTable(newState.table,
        [['ONE-1'], ['ONE-2'], ['ONE-3', 'ONE-6'], ['ONE-4', 'ONE-7']]);
      checkSameColumns(state, newState, 0, 1, 3);
    });

    it ('New issue', () => {
      const issueState: IssueState = issueReducer(
        builder.issueState,
        IssueActions.createChangeIssuesAction({new: [{key: 'ONE-8', state: '1-1', summary: 'Test', priority: 0, type: 0}]},
          builder.getDeserializeIssueLookupParams()));
      const rankState: RankState = rankReducer(
        builder.rankState,
        RankActions.createRerank({ONE: [{index: 7, key: 'ONE-8'}]}, null)
      );
      const newState = issueTableReducer(state, new UpdateActionCreator(builder).issue(issueState).rank(rankState).build());

      checkTable(newState.table,
        [['ONE-1', 'ONE-8'], ['ONE-2'], ['ONE-3', 'ONE-5', 'ONE-6'], ['ONE-4', 'ONE-7']]);

      checkSameColumns(state, newState, 1, 2, 3);
    });

    it ('Rerank issue - no effect on existing states', () => {
      const rankState: RankState = rankReducer(
        builder.rankState,
        RankActions.createRerank({ONE: [{index: 0, key: 'ONE-3'}]}, null)
      );
      const newState = issueTableReducer(state, new UpdateActionCreator(builder).rank(rankState).build());

      checkTable(newState.table,
        [['ONE-1'], ['ONE-2'], ['ONE-3', 'ONE-5', 'ONE-6'], ['ONE-4', 'ONE-7']]);

      checkSameColumns(state, newState, 0, 1, 2, 3);
      // The table should be the same
      expect(state).toBe(newState);
    });


    it ('Rerank issue - effect on existing states', () => {
      const rankState: RankState = rankReducer(
        builder.rankState,
        RankActions.createRerank({ONE: [{index: 6, key: 'ONE-3'}]}, null)
      );
      const newState = issueTableReducer(state, new UpdateActionCreator(builder).rank(rankState).build());

      checkTable(newState.table,
        [['ONE-1'], ['ONE-2'], ['ONE-5', 'ONE-6', 'ONE-3'], ['ONE-4', 'ONE-7']]);

      checkSameColumns(state, newState, 0, 1, 3);
    });
  });
});

export function checkTable(table: List<List<BoardIssue>>, expected: string[][]) {
  const actualTable: string[][] = [];
  table.forEach((v, i) => {
    actualTable.push(table.get(i).map(issue => issue.key).toArray());
  });
  expect(actualTable).toEqual(expected);
}

function checkSameColumns(oldState: IssueTableState, newState: IssueTableState, ...cols: number[]) {
  const expectedEqual: OrderedSet<number> = OrderedSet<number>(cols);
  expect(oldState.table.size).toBe(newState.table.size);
  for (let i = 0 ; i < oldState.table.size ; i++) {
    const oldCol: List<BoardIssue> = oldState.table.get(i);
    const newCol: List<BoardIssue> = newState.table.get(i);
    if (expectedEqual.contains(i)) {
      expect(oldCol).toBe(newCol, 'Column ' + i);
    } else {
      expect(oldCol).not.toBe(newCol, 'Column ' + i);
    }
  }
}


class CreateIssueTableBuilder {
  _issueKeys: string[] = [];
  _issueStates: number[] = [];
  _rankedIssueKeys: any = {};
  _stateMap: Map<string, StateMapping[]> = Map<string, StateMapping[]>();

  private _headerState: HeaderState;
  private _issueState: IssueState;
  private _projectState: ProjectState;
  private _rankState: RankState;

  constructor(private _owner: string, private _numberStates: number) {
  }

  get headerState(): HeaderState {
    return this._headerState;
  }

  get issueState(): IssueState {
    return this._issueState;
  }

  get projectState(): ProjectState {
    return this._projectState;
  }

  get rankState(): RankState {
    return this._rankState;
  }

  addIssue(key: string, state: number): CreateIssueTableBuilder {
    this._issueKeys.push(key);
    this._issueStates.push(state);
    return this;
  }

  setRank(projectKey: string, ...keys: number[]): CreateIssueTableBuilder {
    this._rankedIssueKeys[projectKey] = {};
    this._rankedIssueKeys[projectKey]['ranked'] = keys.map(v => projectKey + '-' + v);
    return this;
  }

  mapState(projectKey: string, boardState: string, ownState: string): CreateIssueTableBuilder {
    let projectMap: StateMapping[] = this._stateMap.get(projectKey);
    if (!projectMap) {
      projectMap = [];
      this._stateMap = this._stateMap.set(projectKey, projectMap);
    }
    projectMap.push(new StateMapping(boardState, ownState));
    return this;
  }

  build(): IssueTableState {
    this.createHeaderState();
    this.createProjectState();
    this.createRankState();
    this.createIssueState();

    return issueTableReducer(initialIssueTableState,
      IssueTableActions.createCreateIssueTable(
        this._headerState,
        this._issueState,
        this._projectState,
        this._rankState));
  }

  getDeserializeIssueLookupParams(): DeserializeIssueLookupParams {
    return new DeserializeIssueLookupParams()
      .setBoardStates(this._headerState.states)
      .setIssueTypes(getTestIssueTypeState().types)
      .setPriorities(getTestPriorityState().priorities)
      .setBoardProjects(this._projectState.boardProjects)
      .setAssignees(getTestAssigneeState().assignees);
  }

  private createHeaderState() {
    const input: any[] = new Array<any>();
    for (let i = 1 ; i <= this._numberStates ; i++) {
      input.push({name: 'S-' + i});
    }
    this._headerState =
      headerReducer(initialHeaderState, HeaderActions.createDeserializeHeaders(input, [], 0, 0));
  }

  private createIssueState() {
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
    this._issueState = issueReducer(
      initialIssueState,
      IssueActions.createDeserializeIssuesAction(
        input,
        this.getDeserializeIssueLookupParams()
      ));
  }

  private createProjectState() {
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

    this._projectState = {
      owner: this._owner,
      boardProjects: projects,
      linkedProjects: Map<string, LinkedProject>(),
      parallelTasks: Map<string, List<ParallelTask>>()
    };
  }

  private createRankState() {
    this._rankState = rankReducer(initialRankState, RankActions.createDeserializeRanks(this._rankedIssueKeys));
  }
}

class UpdateActionCreator {
  private _headerState: HeaderState;
  private _issueState: IssueState;
  private _projectState: ProjectState;
  private _rankState: RankState;

  constructor(private readonly _builder: CreateIssueTableBuilder) {
  }

  header(headerState: HeaderState): UpdateActionCreator {
    this._headerState = headerState;
    return this;
  }

  issue(issueState: IssueState): UpdateActionCreator {
    this._issueState = issueState;
    return this;
  }

  rank(rankState: RankState): UpdateActionCreator {
    this._rankState = rankState;
    return this;
  }

  build(): Action {
    return IssueTableActions.createUpdateIssueTable(
      this._headerState ? this._headerState : this._builder.headerState,
      this._issueState ? this._issueState : this._builder.issueState,
      this._projectState ? this._projectState : this._builder.projectState,
      this._rankState ? this._rankState : this._builder.rankState
    );
  }
}

class StateMapping {

  constructor(public board, public own) {
  }
}


