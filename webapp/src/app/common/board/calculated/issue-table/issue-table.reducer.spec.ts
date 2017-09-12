import {HeaderState, initialHeaderState} from '../../header/header.model';
import {HeaderActions, headerReducer} from '../../header/header.reducer';
import {BoardIssue, Issue, IssueState} from '../../issue/issue.model';
import {List, Map} from 'immutable';
import {BoardProject, LinkedProject, ParallelTask, ProjectState} from '../../project/project.model';
import {initialIssueTableState, IssueTableState} from './issue-table.model';
import {IssueTableActions, issueTableReducer} from './issue-table.reducer';

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
});

function checkTable(table: List<List<BoardIssue>>, expected: string[][]) {
  const actualTable: List<List<string>> = table.map(
    issues => issues.map(
      issue => issue.key).toList()
  ).toList();
  const expectedTable: List<List<string>> = List<List<string>>().withMutations(mutable => {
    expected.forEach(value => mutable.push(List<string>(value)));
  });

  // This does not work as expected, so do the equals check myself
  // expect(actualTable).toEqual(expectedTable);
  expect(actualTable.equals(expectedTable)).toBe(true, 'Expected: ' + actualTable + ' to equal: ' + expectedTable);
}


class CreateIssueTableBuilder {
  _issueKeys: string[] = [];
  _issueStates: number[] = [];
  _rankedIssueKeys: Map<string, List<string>> = Map<string, List<string>>();
  _stateMap: Map<string, StateMapping[]> = Map<string, StateMapping[]>();

  constructor(private _owner: string, private _numberStates: number) {
  }

  addIssue(key: string, state: number): CreateIssueTableBuilder {
    this._issueKeys.push(key);
    this._issueStates.push(state);
    return this;
  }

  setRank(projectKey: string, ...keys): CreateIssueTableBuilder {
    const ranked: string[] = [];
    keys.forEach(v => ranked.push(projectKey + '-' + v));
    this._rankedIssueKeys = this._rankedIssueKeys.set(projectKey, List<string>(ranked));
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
    expect(this._rankedIssueKeys.size).toEqual(this._stateMap.size);
    expect(this._rankedIssueKeys.keySeq().toArray()).toContain(this._owner);
    expect(this._stateMap.keySeq().toArray()).toContain(this._owner);


    return issueTableReducer(initialIssueTableState,
      IssueTableActions.createCreateIssueTable(
        this.createHeaderState(),
        this.createIssueState(),
        this.createProjectState()));
  }

  private createHeaderState(): HeaderState {
    const input: any[] = new Array<any>();
    for (let i = 1 ; i <= this._numberStates ; i++) {
      input.push({name: 'S-' + i});
    }
    return headerReducer(initialHeaderState, HeaderActions.createDeserializeHeaders(input, [], 0, 0));
  }

  private createIssueState(): IssueState {
    // Just mock this, as we don't need most of the data for what we are testing here
    const issues: Map<string, BoardIssue> = Map<string, BoardIssue>().withMutations(mutable => {
      for (let i = 0 ; i < this._issueKeys.length ; i++) {
        const issue: BoardIssue = {
          key: this._issueKeys[i],
          summary: null,
          assignee: null,
          priority: null,
          type: null,
          components: null,
          labels: null,
          fixVersions: null,
          customFields: null,
          parallelTasks: null,
          linkedIssues: List<Issue>(),
          ownState: this._issueStates[i]
        };
        mutable.set(issue.key, issue);
      }
    });
    const issueState: IssueState = {issues: issues};
    return issueState;
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

    const projectState: ProjectState = {
      owner: this._owner,
      boardProjects: projects,
      rankedIssueKeys: this._rankedIssueKeys,
      linkedProjects: Map<string, LinkedProject>(),
      parallelTasks: Map<string, List<ParallelTask>>()
    };
    return projectState;
  }
}

class StateMapping {

  constructor(public board, public own) {
  }
}


