import {BoardStateInitializer, BoardViewObservableUtil, HeaderStateFactory, IssuesFactory} from './board-view.common.spec';
import {HeaderActions, headerMetaReducer} from '../../model/board/data/header/header.reducer';
import {DeserializeIssueLookupParams} from '../../model/board/data/issue/issue.model';
import {HeaderState} from '../../model/board/data/header/header.state';
import {IssueTable} from './issue-table';
import {initialIssueDetailState, IssueDetailState} from '../../model/board/user/issue-detail/issue-detail.model';
import {BoardHeaders} from './board-headers';
import {IssueSummaryLevel} from '../../model/board/user/issue-summary-level';
import {BoardIssueView} from './board-issue-view';
import {BoardIssueViewRecord} from './board-issue-view.model';
import {take} from 'rxjs/operators';

describe('Issue detail view tests', () => {

  let util: BoardViewObservableUtil;
  let headers: BoardHeaders;
  let table: IssueTable;
  let issueDetail: IssueDetailState;

  beforeEach(() => {
    // Just set up some stuff to have some initial data
    const issueFactory: SimpleIssueFactory = new SimpleIssueFactory();
    const headerFactory: HeaderStateFactory = new NumberedHeaderStateFactory(4);
    const init: BoardStateInitializer =
      new BoardStateInitializer()
        .headerStateFactory(headerFactory)
        .mapState('ONE', 'S-1', '1-1')
        .mapState('ONE', 'S-2', '1-2')
        .mapState('ONE', 'S-3', '1-3')
        .mapState('ONE', 'S-4', '1-4')
        .setRank('ONE', 5, 1, 2, 3, 4, 6)
        .issuesFactory(
          issueFactory
            .addIssue('ONE-1', 0)
            .addIssue('ONE-2', 1)
            .addIssue('ONE-3', 2)
            .addIssue('ONE-4', 3)
            .addIssue('ONE-5', 2)
            .addIssue('ONE-6', 2));
    util = new BoardViewObservableUtil().updateBoardState(init);

    util
      .observer()
      .pipe(
        take(1)
      )
      .subscribe(board => {
        headers = board.headers;
        table = board.issueTable;
        issueDetail = board.issueDetail;
        expect(issueDetail).toBe(initialIssueDetailState);
      });
  });

  describe('Update issue level', () => {
    it ('No swimlanes', () => {
      util
        .getUserSettingUpdater()
        .updateIssueSummaryLevel(IssueSummaryLevel.HEADER_ONLY)
        .observer()
        .pipe(
          take(1)
        )
        .subscribe(board => {
          expect(board.headers).toBe(headers);
          expect(board.issueTable).not.toBe(table);
          checkIssues(table, board.issueTable);
          expect(board.issueDetail.issueSummaryLevel).toBe(IssueSummaryLevel.HEADER_ONLY);
          expect(board.issueDetail.parallelTasks).toBe(initialIssueDetailState.parallelTasks);
        });

      util
        .getUserSettingUpdater()
        .updateIssueSummaryLevel(IssueSummaryLevel.SHORT_SUMMARY)
        .observer()
        .pipe(
          take(1)
        )
        .subscribe(board => {
          expect(board.headers).toBe(headers);
          expect(board.issueTable).not.toBe(table);
          checkIssues(table, board.issueTable);
          expect(board.issueDetail.parallelTasks).toBe(initialIssueDetailState.parallelTasks);
        });
    });
    it ('Swimlanes', () => {
      util
        .getUserSettingUpdater()
        .updateSwimlane('project')
        .observer()
        .pipe(
          take(1)
        )
        .subscribe(board => {
          expect(board.headers).toBe(headers);
          expect(board.issueTable).not.toBe(table);
          checkIssues(table, board.issueTable);
          table = board.issueTable;
          expect(board.issueDetail).toBe(initialIssueDetailState);
        });
      util
        .getUserSettingUpdater()
        .updateIssueSummaryLevel(IssueSummaryLevel.HEADER_ONLY)
        .observer()
        .pipe(
          take(1)
        )
        .subscribe(board => {
          expect(board.headers).toBe(headers);
          expect(board.issueTable).not.toBe(table);
          checkIssues(table, board.issueTable);
          expect(board.issueDetail.issueSummaryLevel).toBe(IssueSummaryLevel.HEADER_ONLY);
          expect(board.issueDetail.parallelTasks).toBe(initialIssueDetailState.parallelTasks);
        });

      util
        .getUserSettingUpdater()
        .updateIssueSummaryLevel(IssueSummaryLevel.SHORT_SUMMARY)
        .observer()
        .pipe(
          take(1)
        )
        .subscribe(board => {
          expect(board.headers).toBe(headers);
          expect(board.issueTable).not.toBe(table);
          checkIssues(table, board.issueTable);
          expect(board.issueDetail.issueSummaryLevel).toBe(IssueSummaryLevel.SHORT_SUMMARY);
          expect(board.issueDetail.parallelTasks).toBe(initialIssueDetailState.parallelTasks);
        });
    });
  });


  class SimpleIssueFactory implements IssuesFactory {
    _issueKeys: string[];
    _issueStates: number[];

    addIssue(key: string, state: number): SimpleIssueFactory {
      if (!this._issueKeys) {
        this._issueKeys = [];
        this._issueStates = [];
      }
      this._issueKeys.push(key);
      this._issueStates.push(state);
      return this;
    }

    clear() {
      this._issueKeys = null;
      this._issueStates = null;
    }

    createIssueStateInput(params: DeserializeIssueLookupParams): any {
      const input: any = {};
      for (let i = 0 ; i < this._issueKeys.length ; i++) {
        const id = Number(this._issueKeys[i].substr(this._issueKeys[i].indexOf('-') + 1));
        input[this._issueKeys[i]] = {
          key: this._issueKeys[i],
          type: id % 2,
          priority: id % 2,
          summary: '-',
          state: this._issueStates[i]
        };
      }
      return input;
    }
  }

  class NumberedHeaderStateFactory implements HeaderStateFactory {
    constructor(private _numStates: number) {
    }

    createHeaderState(currentState: HeaderState): HeaderState {
      const input: any = [];
      for (let i = 1 ; i <= this._numStates ; i++) {
        input.push({name: 'S-' + i});
      }
      return headerMetaReducer(currentState,
        HeaderActions.createDeserializeHeaders(input, [], this.getBacklog(), 0));
    }

    getBacklog() {
      return 0;
    }
  }

});


function checkIssues(original: IssueTable, current: IssueTable) {
  expect(original.table.size).toBe(current.table.size);
  original.table.forEach((col, i) => {
    expect(col.size).toBe(current.table.get(i).size);
    col.forEach((originalIssue, j) => {
      const currIssue: BoardIssueView = current.table.get(i).get(j);

      const keys: string[] = (<BoardIssueViewRecord>currIssue).keySeq().toArray();
      for (const key of keys) {
        if (key === 'calculatedTotalHeight') {
          expect(currIssue[key]).toEqual(originalIssue[key]);
        }
      }
    });
  })
}
