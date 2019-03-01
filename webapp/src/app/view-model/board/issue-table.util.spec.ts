import {BoardViewModel} from './board-view';
import {List, OrderedSet, Set} from 'immutable';
import {BoardIssueView} from './board-issue-view';
import {HeaderStateFactory, IssuesFactory} from './board-view.common.spec';
import {Dictionary} from '../../common/dictionary';
import {DeserializeIssueLookupParams} from '../../model/board/data/issue/issue.model';
import {HeaderState} from '../../model/board/data/header/header.state';
import {HeaderActions, headerMetaReducer} from '../../model/board/data/header/header.reducer';
import {initialIssueDetailState, IssueDetailState} from '../../model/board/user/issue-detail/issue-detail.model';
import {IssueTable} from './issue-table';
import {BoardHeader} from './board-header';


/**
 * Utilities for issue-table.spec.ts and issue-table-filters.spec.ts
 */


export function checkSameColumns(oldState: BoardViewModel, newState: BoardViewModel, ...cols: number[]) {
  const oldTable: List<List<BoardIssueView>> = oldState.issueTable.table;
  const newTable: List<List<BoardIssueView>> = newState.issueTable.table;

  const expectedEqual: OrderedSet<number> = OrderedSet<number>(cols);
  expect(oldTable.size).toBe(newTable.size);
  for (let i = 0; i < oldTable.size; i++) {
    const oldCol: List<BoardIssueView> = oldTable.get(i);
    const newCol: List<BoardIssueView> = newTable.get(i);
    if (expectedEqual.contains(i)) {
      expect(oldCol).toBe(newCol, 'Column ' + i);
    } else {
      expect(oldCol).not.toBe(newCol, 'Column ' + i);
    }
  }
}


export class SimpleIssueFactory implements IssuesFactory {
  _issues: Dictionary<any>;

  addIssue(key: string, state: number, data?: any): SimpleIssueFactory {
    if (!this._issues) {
      this._issues = {};
    }
    this._issues[key] = !data ? {} : data;
    this._issues[key]['state'] = state;
    return this;
  }

  clear() {
    this._issues = null;
  }

  createIssueStateInput(params: DeserializeIssueLookupParams): any {
    const input: any = {};
    for (const key of Object.keys(this._issues)) {
      const id = Number(key.substr(key.indexOf('-') + 1));
      const assignee: number = id % 3 === 2 ? null : id % 3;
      const isssue = {
        key: key,
        type: id % 2,
        priority: id % 2,
        summary: '-',
      };

      const data: any = this._issues[key];
      for (const override of Object.keys(data)) {
        isssue[override] = data[override];
      }

      input[key] = isssue;
    }

    return input;
  }
}

export class IssueWithTypeIssueFactory implements IssuesFactory {
  private _issueKeys: string[];
  private _issueTypes: string[];
  private _issueStates: number[];

  addIssue(key: string, issueType: string, state: number): IssueWithTypeIssueFactory {
    if (!this._issueKeys) {
      this._issueKeys = [];
      this._issueTypes = [];
      this._issueStates = [];
    }
    this._issueKeys.push(key);
    this._issueTypes.push(issueType);
    this._issueStates.push(state);
    return this;
  }

  clear() {
    this._issueKeys = null;
    this._issueTypes = null;
    this._issueStates = null;
  }

  createIssueStateInput(params: DeserializeIssueLookupParams): any {
    const input: any = {};

    const typeIndicesByKey: any = {};
    let index = 0;
    params.issueTypes.forEach(type => {
      typeIndicesByKey[type.name] = index;
      index++;
    });

    for (let i = 0; i < this._issueKeys.length; i++) {
      const typeIndex: number = typeIndicesByKey[this._issueTypes[i]];
      const id = Number(this._issueKeys[i].substr(this._issueKeys[i].indexOf('-') + 1));
      input[this._issueKeys[i]] = {
        key: this._issueKeys[i],
        type: typeIndex,
        priority: id % 2,
        summary: '-',
        state: this._issueStates[i]
      };
    }
    return input;
  }
}

export class NumberedHeaderStateFactory implements HeaderStateFactory {
  constructor(private _numStates: number) {
  }

  createHeaderState(currentState: HeaderState): HeaderState {
    const input: any = [];
    for (let i = 1; i <= this._numStates; i++) {
      input.push({name: 'S-' + i});
    }
    return headerMetaReducer(currentState,
      HeaderActions.createDeserializeHeaders(input, [], this.getBacklog(), 0));
  }

  getBacklog() {
    return 0;
  }
}

export class NumberedHeaderWithBacklogStateFactory extends NumberedHeaderStateFactory {
  constructor(numStates: number) {
    super(numStates);
  }

  getBacklog() {
    return 1;
  }
}

export class BoardChecker {
  private _invisibleIssues: string[] = [];
  private _nonMatchingIssues: string[] = [];
  private _rankView = false;
  private _rankOrder: string[] = null;
  private _issueDetailsState: IssueDetailState;

  constructor(private _expected: string[][]) {
  }

  invisibleIssues(...invisible: string[]): BoardChecker {
    this._invisibleIssues = invisible;
    return this;
  }

  nonMatchingIssues(...nonMatching: string[]): BoardChecker {
    this._nonMatchingIssues = nonMatching;
    return this;
  }

  issueDetailState(state: IssueDetailState): BoardChecker {
    this._issueDetailsState = state;
    return this;
  }


  rankOrder(rankView: boolean, ...rankOrder: string[]): BoardChecker {
    this._rankView = rankView;
    this._rankOrder = rankOrder;
    return this;
  }

  checkBoard(board: BoardViewModel) {
    // Get rid of all the invisible issues from the 'expected' table
    const invisibleIssueSet: Set<string> = Set<string>(this._invisibleIssues);
    const expectedVisible: string[][] = this._expected.map(
      col => col.filter(k => !invisibleIssueSet.contains(k)));


    if (!this._issueDetailsState) {
      // We are not changing the issue details in this test unless explicitly triggered
      expect(board.issueDetail).toBe(initialIssueDetailState);
    } else {
      expect(board.issueDetail.issueSummaryLevel).toBe(this._issueDetailsState.issueSummaryLevel);
      expect(board.issueDetail.parallelTasks).toBe(this._issueDetailsState.parallelTasks);
      expect(board.issueDetail.linkedIssues).toBe(this._issueDetailsState.linkedIssues);
    }

    const issueTable: IssueTable = board.issueTable;
    // Convert the issue table to a string[][]
    const actualTable: string[][] = [];
    issueTable.table.forEach((v, i) => {
      actualTable.push(issueTable.table.get(i).map(issue => issue.key).toArray());
    });
    expect(actualTable).toEqual(expectedVisible);

    // Check the size of the issues map
    expect(issueTable.issues.size).toBe(
      this._invisibleIssues.length + expectedVisible.map(issues => issues.length).reduce((s, c) => s + c));

    // Check issue visibilities
    const invisibleKeys: string[] =
      issueTable.issues.filter(issue => !issue.visible).keySeq().toArray().sort((a, b) => a.localeCompare(b));
    expect(invisibleKeys).toEqual([...this._invisibleIssues].sort((a, b) => a.localeCompare(b)));

    const nonMatchingIssueKeys: string[] =
      issueTable.issues.filter(issue => !issue.matchesSearch).keySeq().toArray().sort((a, b) => a.localeCompare(b));
    expect(nonMatchingIssueKeys).toEqual([...this._nonMatchingIssues].sort((a, b) => a.localeCompare(b)));

    // Check issue counts
    const totalIssueCounts: number[] = new Array<number>(this._expected.length);
    const visibleIssueCounts: number[] = new Array<number>(this._expected.length);
    for (let i = 0; i < this._expected.length; i++) {
      visibleIssueCounts[i] = this._expected[i].reduce((s, v, ind, arr) => {
        return invisibleIssueSet.contains(arr[ind]) ? s : s + 1;
      }, 0);
      totalIssueCounts[i] = this._expected[i].length;
    }

    // Check header counts
    board.headers.headersList.forEach(header => this.checkHeader(header, totalIssueCounts, visibleIssueCounts));

    if (!this._rankView) {
      expect(issueTable.rankView.size).toBe(0);
    } else {
      const expectedVisibleRank: string[] = this._rankOrder.filter(k => !invisibleIssueSet.contains(k));
      // Work out the board index from the issue table
      const issueDictionary: Dictionary<number> = {};
      issueTable.table.forEach((state, boardIndex) => {
        state.forEach(issue => issueDictionary[issue.key] = boardIndex);
      });
      expect(issueTable.rankView.map(re => re.issue.key).toArray()).toEqual(expectedVisibleRank);
      issueTable.rankView.forEach(re => expect(re.boardIndex).toBe((issueDictionary[re.issue.key])));
    }

    // Check the ranks by project in the issue table
    const ranksForProjectDict: Dictionary<Dictionary<number>> = {};
    for (const key of this._rankOrder) {
      const projectCode: string = key.split('-')[0];
      let ranksForProject: Dictionary<number> = ranksForProjectDict[projectCode];
      if (!ranksForProject) {
        ranksForProject = {};
        ranksForProjectDict[projectCode] = ranksForProject;
      }
      ranksForProject[key] = Object.keys(ranksForProject).length + 1;
    }
    const actualRanksByProject: any = {};
    issueTable.issueRanksByProject.forEach((value, key) => actualRanksByProject[key] = value.toObject());
    expect(issueTable.issueRanksByProject.toObject()).toEqual(actualRanksByProject);

  }

  private checkHeader(header: BoardHeader, totalIssueCounts: number[], visibleIssueCounts: number[]) {
    if (header.category) {
      let total = 0;
      let visible = 0;
      header.states.forEach((h) => {
        this.checkHeader(h, totalIssueCounts, visibleIssueCounts);
        total += h.totalIssues;
        visible += h.visibleIssues;
      });
      let expectedTotal = 0;
      let expectedVisible = 0;
      header.stateIndices.forEach(i => {
        expectedTotal += totalIssueCounts[i];
        expectedVisible += visibleIssueCounts[i];
      });
      expect(total).toBe(expectedTotal);
      expect(visible).toBe(expectedVisible);

    } else {
      const stateIndex = header.stateIndices.get(0);
      expect(header.totalIssues).toBe(totalIssueCounts[stateIndex]);
      expect(header.visibleIssues).toBe(visibleIssueCounts[stateIndex]);
    }
  }
}
