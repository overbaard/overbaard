import {
  BoardStateInitializer, BoardViewObservableUtil, HeaderStateFactory,
  IssuesFactory
} from './board-view.common.spec';
import {DeserializeIssueLookupParams} from '../../model/board/data/issue/issue.model';
import {HeaderState} from '../../model/board/data/header/header.state';
import {HeaderActions, headerMetaReducer} from '../../model/board/data/header/header.reducer';
import {initialHeaderState} from '../../model/board/data/header/header.model';
import 'rxjs/add/operator/take';
import {IssueTable} from './issue-table';
import {List, OrderedSet, Set} from 'immutable';
import {Dictionary} from '../../common/dictionary';
import {BoardViewModel} from './board-view';
import {BoardHeader} from './board-header';

describe('Issue Table observer tests', () => {

  let issueFactory: SimpleIssueFactory;
  let headerFactory: HeaderStateFactory;
  let init: BoardStateInitializer;

  beforeEach(() => {
    issueFactory = new SimpleIssueFactory();
    headerFactory = new NumberedHeaderStateFactory(4);
    init =
      new BoardStateInitializer('ONE')
        .headerStateFactory(headerFactory)
        .mapState('ONE', 'S-1', '1-1')
        .mapState('ONE', 'S-2', '1-2')
        .mapState('ONE', 'S-3', '1-3')
        .mapState('ONE', 'S-4', '1-4');
  });

  describe('Create tests', () => {
    describe('One project issues', () => {
      it('All states mapped, issues in all states', () => {
        init
          .setRank('ONE', 5, 1, 2, 3, 4, 6)
          .issuesFactory(
            issueFactory
              .addIssue('ONE-1', 0)
              .addIssue('ONE-2', 1)
              .addIssue('ONE-3', 2)
              .addIssue('ONE-4', 3)
              .addIssue('ONE-5', 2)
              .addIssue('ONE-6', 2)
          );
        new BoardViewObservableUtil()
          .initializeBoardState(init)
          .observer()
          .take(1)
          .subscribe(board => {
            new BoardChecker([['ONE-1'], ['ONE-2'], ['ONE-5', 'ONE-3', 'ONE-6'], ['ONE-4']])
              .checkBoard(board);
          });
      });
      it('All states mapped, issues in some states', () => {
        init
          .setRank('ONE', 5, 1, 2, 3, 4)
          .issuesFactory(
            issueFactory
              .addIssue('ONE-1', 1)
              .addIssue('ONE-2', 1)
              .addIssue('ONE-3', 2)
              .addIssue('ONE-4', 3)
              .addIssue('ONE-5', 2),
          );
        new BoardViewObservableUtil()
          .initializeBoardState(init)
          .observer()
          .take(1)
          .subscribe(board => {
            new BoardChecker([[], ['ONE-1', 'ONE-2'], ['ONE-5', 'ONE-3'], ['ONE-4']])
              .checkBoard(board);
          });
      });
      it('Not all states mapped, issues in all states', () => {
        init =
          new BoardStateInitializer('ONE')
            .headerStateFactory(headerFactory)
            .setRank('ONE', 4, 3, 2, 1)
            .mapState('ONE', 'S-2', '1-1')
            .mapState('ONE', 'S-4', '1-2')
            .issuesFactory(
              issueFactory
                .addIssue('ONE-1', 0)
                .addIssue('ONE-2', 0)
                .addIssue('ONE-3', 1)
                .addIssue('ONE-4', 1)
            );
        new BoardViewObservableUtil()
          .initializeBoardState(init)
          .observer()
          .take(1)
          .subscribe(board => {
            new BoardChecker([[], ['ONE-2', 'ONE-1'], [], ['ONE-4', 'ONE-3']])
              .checkBoard(board);
          });
      });
    });

    describe('Two project issues', () => {
      it('All states mapped, issues in all states', () => {
        init
          .setRank('ONE', 1, 2, 3, 4, 5, 6)
          // ONE's states are already mapped above
          .setRank('TWO', 6, 5, 4, 3, 2, 1)
          .mapState('TWO', 'S-1', '2-1')
          .mapState('TWO', 'S-2', '2-2')
          .mapState('TWO', 'S-3', '2-3')
          .mapState('TWO', 'S-4', '2-4')
          .issuesFactory(
            issueFactory
              .addIssue('ONE-1', 0)
              .addIssue('ONE-2', 1)
              .addIssue('ONE-3', 2)
              .addIssue('ONE-4', 3)
              .addIssue('ONE-5', 2)
              .addIssue('ONE-6', 2)
              .addIssue('TWO-1', 0)
              .addIssue('TWO-2', 1)
              .addIssue('TWO-3', 2)
              .addIssue('TWO-4', 3)
              .addIssue('TWO-5', 2)
              .addIssue('TWO-6', 2)
          );
        new BoardViewObservableUtil()
          .initializeBoardState(init)
          .observer()
          .take(1)
          .subscribe(board => {
            new BoardChecker([
              ['ONE-1', 'TWO-1'],
              ['ONE-2', 'TWO-2'],
              ['ONE-3', 'ONE-5', 'ONE-6', 'TWO-6', 'TWO-5', 'TWO-3'],
              ['ONE-4', 'TWO-4']])
              .checkBoard(board);
          });
      });
      it('Not all states mapped, issues in all states', () => {
        init =
          new BoardStateInitializer('ONE')
            .headerStateFactory(new NumberedHeaderStateFactory(5))
            .setRank('ONE', 3, 2, 1)
            .mapState('ONE', 'S-2', '1-1')
            .mapState('ONE', 'S-3', '1-2')
            .setRank('TWO', 3, 2, 1)
            .mapState('TWO', 'S-3', '2-1')
            .mapState('TWO', 'S-4', '2-2')
            .issuesFactory(
              issueFactory
                .addIssue('ONE-1', 0)
                .addIssue('ONE-2', 0)
                .addIssue('ONE-3', 1)
                .addIssue('TWO-1', 0)
                .addIssue('TWO-2', 1)
                .addIssue('TWO-3', 1)
            );
          new BoardViewObservableUtil()
          .initializeBoardState(init)
          .observer()
          .take(1)
          .subscribe(board => {
            new BoardChecker([
              [],
              ['ONE-2', 'ONE-1'],
              ['ONE-3', 'TWO-1'],
              ['TWO-3', 'TWO-2'],
              []])
              .checkBoard(board);
          });
      });
    });

    describe('', () => {
      let util: BoardViewObservableUtil;
      let original: BoardViewModel;
      beforeEach(() => {
        init =
          new BoardStateInitializer('ONE')
            .headerStateFactory(headerFactory)
            .setRank('ONE', 1, 2, 3, 4, 5, 6, 7)
            .mapState('ONE', 'S-1', '1-1')
            .mapState('ONE', 'S-2', '1-2')
            .mapState('ONE', 'S-3', '1-3')
            .mapState('ONE', 'S-4', '1-4')
            .issuesFactory(
              issueFactory
                .addIssue('ONE-1', 0)
                .addIssue('ONE-2', 1)
                .addIssue('ONE-3', 2)
                .addIssue('ONE-4', 3)
                .addIssue('ONE-5', 2)
                .addIssue('ONE-6', 2)
                .addIssue('ONE-7', 3)
            );
        /*new BoardViewObservableUtil()
          .initializeBoardState()*/
        util = new BoardViewObservableUtil()
          .initializeBoardState(init);
        util
          .observer()
          .take(1)
          .subscribe(board => {
            new BoardChecker([['ONE-1'], ['ONE-2'], ['ONE-3', 'ONE-5', 'ONE-6'], ['ONE-4', 'ONE-7']])
              .checkBoard(board);
            original = board;
          });
      });
      it('Update issue detail', () => {
        util
          .getBoardStateUpdater()
          .issueChanges({update: [{key: 'ONE-2', summary: 'Test summary'}]})
          .emit()
          .observer()
          .take(1)
          .subscribe(board => {
            new BoardChecker([['ONE-1'], ['ONE-2'], ['ONE-3', 'ONE-5', 'ONE-6'], ['ONE-4', 'ONE-7']])
              .checkBoard(board);
            expect(board.issueTable.table).toBe(original.issueTable.table);
            expect(board.issueTable.issues.get('ONE-2').summary).toEqual('Test summary');
            expect(board.headers).toBe(board.headers);
          });
      });
      it('Update issue state', () => {
        util
          .getBoardStateUpdater()
          .issueChanges({update: [{key: 'ONE-5', state: '1-2'}]})
          .emit()
          .observer()
          .take(1)
          .subscribe(board => {
            new BoardChecker([['ONE-1'], ['ONE-2', 'ONE-5'], ['ONE-3', 'ONE-6'], ['ONE-4', 'ONE-7']])
              .checkBoard(board);
            original = board;
          });
        // Empty a state completely
        util
          .getBoardStateUpdater()
          .issueChanges({update: [{key: 'ONE-1', state: '1-2'}]})
          .emit()
          .observer()
          .take(1)
          .subscribe(board => {
            new BoardChecker([[], ['ONE-1', 'ONE-2', 'ONE-5'], ['ONE-3', 'ONE-6'], ['ONE-4', 'ONE-7']])
              .checkBoard(board);
            checkSameColumns(original, board, 2, 3);
            original = board;
          });
        // Populate an empty state again
        util
          .getBoardStateUpdater()
          .issueChanges({update: [{key: 'ONE-1', state: '1-1'}]})
          .emit()
          .observer()
          .take(1)
          .subscribe(board => {
            new BoardChecker([['ONE-1'], ['ONE-2', 'ONE-5'], ['ONE-3', 'ONE-6'], ['ONE-4', 'ONE-7']])
              .checkBoard(board);
            checkSameColumns(original, board, 2, 3);
          });
      });

      it('Delete issue', () => {
        util
          .getBoardStateUpdater()
          .issueChanges({delete: ['ONE-5']})
          .emit()
          .observer()
          .take(1)
          .subscribe(
            board => {
              new BoardChecker([['ONE-1'], ['ONE-2'], ['ONE-3', 'ONE-6'], ['ONE-4', 'ONE-7']])
                .checkBoard(board);
              checkSameColumns(original, board, 0, 1, 3);
              original = board;
            });
        // Empty a state completely
        util
          .getBoardStateUpdater()
          .issueChanges({delete: ['ONE-1']})
          .emit()
          .observer()
          .take(1)
          .subscribe(
            board => {
              new BoardChecker([[], ['ONE-2'], ['ONE-3', 'ONE-6'], ['ONE-4', 'ONE-7']])
                .checkBoard(board);
              checkSameColumns(original, board, 1, 2, 3);
              original = board;
            });
      });

      describe('New issue', () => {
        it('Main project', () => {
          util
            .getBoardStateUpdater()
            .issueChanges({new: [{key: 'ONE-8', state: '1-1', summary: 'Test', priority: 'Major', type: 'task'}]})
            .rankChanges({ONE: [{index: 7, key: 'ONE-8'}]})
            .emit()
            .observer()
            .take(1)
            .subscribe(
              board => {
                new BoardChecker([['ONE-1', 'ONE-8'], ['ONE-2'], ['ONE-3', 'ONE-5', 'ONE-6'], ['ONE-4', 'ONE-7']])
                  .checkBoard(board);
                checkSameColumns(original, board, 1, 2, 3);
              });
        });
        it('Other project', () => {
          init =
            new BoardStateInitializer('ONE')
              .headerStateFactory(headerFactory)
              .setRank('ONE', 1, 2, 3, 4, 5, 6, 7)
              .setRank('TWO', 1, 2)
              .mapState('ONE', 'S-1', '1-1')
              .mapState('ONE', 'S-2', '1-2')
              .mapState('ONE', 'S-3', '1-3')
              .mapState('ONE', 'S-4', '1-4')
              .mapState('TWO', 'S-3', '2-1')
              .mapState('TWO', 'S-4', '2-2')
              .issuesFactory(
                issueFactory
                  .addIssue('ONE-1', 0)
                  .addIssue('ONE-2', 1)
                  .addIssue('ONE-3', 2)
                  .addIssue('ONE-4', 3)
                  .addIssue('ONE-5', 2)
                  .addIssue('ONE-6', 2)
                  .addIssue('ONE-7', 3)
                  .addIssue('TWO-1', 0)
                  .addIssue('TWO-2', 1)
              );
          util =
            new BoardViewObservableUtil()
              .initializeBoardState(init);
          util
            .observer()
            .take(1)
            .subscribe(
              board => {
                new BoardChecker([['ONE-1'], ['ONE-2'], ['ONE-3', 'ONE-5', 'ONE-6', 'TWO-1'], ['ONE-4', 'ONE-7', 'TWO-2']])
                  .checkBoard(board);
                original = board;
              });
          util
            .getBoardStateUpdater()
            .issueChanges({new: [{key: 'TWO-3', state: '2-1', summary: 'Test', priority: 'Major', type: 'task'}]})
            .rankChanges({TWO: [{index: 2, key: 'TWO-3'}]})
            .emit()
            .observer()
            .take(1)
            .subscribe(
              board => {
                new BoardChecker([['ONE-1'], ['ONE-2'], ['ONE-3', 'ONE-5', 'ONE-6', 'TWO-1', 'TWO-3'], ['ONE-4', 'ONE-7', 'TWO-2']])
                  .checkBoard(board);
                checkSameColumns(original, board, 0, 1, 3);
              });
        });
      });

      it('Rerank issue - no effect on existing states', () => {
        util
          .getBoardStateUpdater()
          .rankChanges({ONE: [{index: 0, key: 'ONE-3'}]})
          .emit()
          .observer()
          .take(1)
          .subscribe(
            board => {
              // Everything should be the same in the issue table and headers
              expect(board.issueTable).toBe(original.issueTable);
              expect(board.headers).toBe(original.headers);
            });
      });

      it ('Rerank issue - effect on existing states', () => {
        util
          .getBoardStateUpdater()
          .rankChanges({ONE: [{index: 6, key: 'ONE-3'}]})
          .emit()
          .observer()
          .take(1)
          .subscribe(
            board => {
              new BoardChecker([['ONE-1'], ['ONE-2'], ['ONE-5', 'ONE-6', 'ONE-3'], ['ONE-4', 'ONE-7']])
                .checkBoard(board)
              checkSameColumns(original, board, 0, 1, 3);
            });
      });

    });
  });
});

describe('Issue table filter tests', () => {

  // We only test filtering on priority here - we have other tests doing in-depth testing of the filters

  it('Update filter for existing table', () => {
    const util: BoardViewObservableUtil = setupTable();
    util.observer().take(1).subscribe(board => {
      new BoardChecker([['ONE-1', 'ONE-2'], ['ONE-3', 'ONE-4', 'ONE-5'], ['ONE-6', 'ONE-7', 'ONE-8', 'ONE-9']])
        .checkBoard(board)
    });

    util.getUserSettingUpdater().updateFilters('priority', 'Blocker');
    util.observer().take(1).subscribe(board => {
      new BoardChecker([['ONE-1', 'ONE-2'], ['ONE-3', 'ONE-4', 'ONE-5'], ['ONE-6', 'ONE-7', 'ONE-8', 'ONE-9']])
        .invisibleIssues('ONE-1', 'ONE-3', 'ONE-5', 'ONE-7', 'ONE-9')
        .checkBoard(board);
      // The visible issue counts are checked automatically in checkTable(), but do a sanity test here
      expect(board.headers.headersList.map(h => h.visibleIssues).toArray()).toEqual([1, 1, 2]);
    });

    util.getUserSettingUpdater().updateFilters('priority', 'Major');
    util.observer().take(1).subscribe(board => {
      new BoardChecker([['ONE-1', 'ONE-2'], ['ONE-3', 'ONE-4', 'ONE-5'], ['ONE-6', 'ONE-7', 'ONE-8', 'ONE-9']])
        .invisibleIssues('ONE-2', 'ONE-4', 'ONE-6', 'ONE-8')
        .checkBoard(board);
      // The visible issue counts are checked automatically in checkTable(), but do a sanity test here
      expect(board.headers.headersList.map(h => h.visibleIssues).toArray()).toEqual([1, 2, 2]);
    });
  });

  it('Filter exists when creating table', () => {
    const util: BoardViewObservableUtil = setupTable({priority: 'Major'});
    util.observer().take(1).subscribe(board => {
      new BoardChecker([['ONE-1', 'ONE-2'], ['ONE-3', 'ONE-4', 'ONE-5'], ['ONE-6', 'ONE-7', 'ONE-8', 'ONE-9']])
        .invisibleIssues('ONE-2', 'ONE-4', 'ONE-6', 'ONE-8')
        .checkBoard(board);
    });
  });

  describe('Update table when filter exists ', () => {
    describe('New Issue', () => {
      it('Matching filter', () => {
        setupTable({priority: 'Major'})
          .getBoardStateUpdater()
          .issueChanges({new: [{key: 'ONE-10', state: '1-1', summary: 'Test', priority: 'Major', type: 'task'}]})
          .rankChanges({ONE: [{index: 9, key: 'ONE-10'}]})
          .emit()
          .observer().take(1).subscribe(board => {
          new BoardChecker([['ONE-1', 'ONE-2', 'ONE-10'], ['ONE-3', 'ONE-4', 'ONE-5'], ['ONE-6', 'ONE-7', 'ONE-8', 'ONE-9']])
            .invisibleIssues('ONE-2', 'ONE-4', 'ONE-6', 'ONE-8')
            .checkBoard(board);
        });
      });
      it('Not matching filter', () => {
        setupTable({priority: 'Major'})
          .getBoardStateUpdater()
          .issueChanges({new: [{key: 'ONE-10', state: '1-1', summary: 'Test', priority: 'Blocker', type: 'task'}]})
          .rankChanges({ONE: [{index: 9, key: 'ONE-10'}]})
          .emit()
          .observer().take(1).subscribe(board => {
          new BoardChecker([['ONE-1', 'ONE-2', 'ONE-10'], ['ONE-3', 'ONE-4', 'ONE-5'], ['ONE-6', 'ONE-7', 'ONE-8', 'ONE-9']])
            .invisibleIssues('ONE-2', 'ONE-4', 'ONE-6', 'ONE-8', 'ONE-10')
            .checkBoard(board);
        });
      });
      describe('Update Issue', () => {
        it('Matching filter', () => {
          setupTable({priority: 'Major'})
            .getBoardStateUpdater()
            .issueChanges({update: [{key: 'ONE-2', priority: 'Major'}]})
            .emit()
            .observer().take(1).subscribe(board => {
            new BoardChecker([['ONE-1', 'ONE-2'], ['ONE-3', 'ONE-4', 'ONE-5'], ['ONE-6', 'ONE-7', 'ONE-8', 'ONE-9']])
              .invisibleIssues('ONE-4', 'ONE-6', 'ONE-8')
              .checkBoard(board);
          });
        });
        it('Not matching filter', () => {
          setupTable({priority: 'Major'})
            .getBoardStateUpdater()
            .issueChanges({update: [{key: 'ONE-1', priority: 'Blocker'}]})
            .emit()
            .observer().take(1).subscribe(board => {
            new BoardChecker([['ONE-1', 'ONE-2'], ['ONE-3', 'ONE-4', 'ONE-5'], ['ONE-6', 'ONE-7', 'ONE-8', 'ONE-9']])
              .invisibleIssues('ONE-1', 'ONE-2', 'ONE-4', 'ONE-6', 'ONE-8')
              .checkBoard(board);
          });
        });
      });
    });
  });

  function setupTable(params?: Dictionary<string>): BoardViewObservableUtil {
    const init =
      new BoardStateInitializer('ONE')
        .headerStateFactory(new NumberedHeaderStateFactory(3))
        .setRank('ONE', 1, 2, 3, 4, 5, 6, 7, 8, 9)
        .mapState('ONE', 'S-1', '1-1')
        .mapState('ONE', 'S-2', '1-2')
        .mapState('ONE', 'S-3', '1-3')
        .issuesFactory(
          new SimpleIssueFactory()
            .addIssue('ONE-1', 0)
            .addIssue('ONE-2', 0)
            .addIssue('ONE-3', 1)
            .addIssue('ONE-4', 1)
            .addIssue('ONE-5', 1)
            .addIssue('ONE-6', 2)
            .addIssue('ONE-7', 2)
            .addIssue('ONE-8', 2)
            .addIssue('ONE-9', 2),
        );
    const util: BoardViewObservableUtil = new BoardViewObservableUtil(params)
      .initializeBoardState(init);

    return util;
  }
});


function checkSameColumns(oldState: BoardViewModel, newState: BoardViewModel, ...cols: number[]) {
  const oldTable: List<List<string>> = oldState.issueTable.table;
  const newTable: List<List<string>> = newState.issueTable.table;

  const expectedEqual: OrderedSet<number> = OrderedSet<number>(cols);
  expect(oldTable.size).toBe(newTable.size);
  for (let i = 0 ; i < oldTable.size ; i++) {
    const oldCol: List<string> = oldTable.get(i);
    const newCol: List<string> = newTable.get(i);
    if (expectedEqual.contains(i)) {
      expect(oldCol).toBe(newCol, 'Column ' + i);
    } else {
      expect(oldCol).not.toBe(newCol, 'Column ' + i);
    }
  }
}



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

  createHeaderState(): HeaderState {
    const input: any = [];
    for (let i = 1 ; i <= this._numStates ; i++) {
      input.push({name: 'S-' + i});
    }
    return headerMetaReducer(initialHeaderState,
      HeaderActions.createDeserializeHeaders(input, [], 0, 0));
  }
}

class JsonHeaderStateFactory implements HeaderStateFactory {
  private _headers: string[]
  constructor(private _statesInput: any[], ..._headers: string[]) {
    this._headers = _headers;
  }

  createHeaderState(): HeaderState {
    return headerMetaReducer(initialHeaderState,
      HeaderActions.createDeserializeHeaders(this._statesInput, this._headers, 0, 0));
  }
}

class BoardChecker {
  private _invisibleIssues: string[] = [];
  private _backlog = 0;

  constructor(private _expected: string[][]) {
  }

  invisibleIssues(...invisible: string[]): BoardChecker {
    this._invisibleIssues = invisible;
    return this;
  }

  backlog(backlog: number): BoardChecker {
    this._backlog = backlog;
    return this;
  }

  checkBoard(board: BoardViewModel) {
    const issueTable: IssueTable = board.issueTable;

    const actualTable: string[][] = [];
    issueTable.table.forEach((v, i) => {
      actualTable.push(issueTable.table.get(i).toArray());
    });
    expect(actualTable).toEqual(this._expected);

    // Check the size of the issues map
    expect(issueTable.issues.size).toBe(this._expected.map(issues => issues.length).reduce((s, c) => s + c));

    // Check issue visibilities
    const invisibleKeys: string[] =
      issueTable.issues.filter(issue => !issue.visible).keySeq().toArray().sort((a, b) => a.localeCompare(b));
    expect(invisibleKeys).toEqual(this._invisibleIssues.sort((a, b) => a.localeCompare(b)));

    // Check issue counts
    const invisibleIssueSet: Set<string> = Set<string>(this._invisibleIssues);
    const totalIssueCounts: number[] = new Array<number>(this._expected.length);
    const visibleIssueCounts: number[] = new Array<number>(this._expected.length);
    for (let i = 0 ; i < this._expected.length ; i++) {
      visibleIssueCounts[i] = this._expected[i].reduce((s, v, ind, arr) => {
        return invisibleIssueSet.contains(arr[ind]) ? s : s + 1;
      }, 0);
      totalIssueCounts[i] = this._expected[i].length;
    }

    // Check header counts
    board.headers.headersList.forEach(header => this.checkHeader(header, totalIssueCounts, visibleIssueCounts));
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
      })
      expect(total).toBe(expectedTotal);
      expect(visible).toBe(expectedVisible);

    } else {
      const stateIndex = header.stateIndices.get(0);
      expect(header.totalIssues).toBe(totalIssueCounts[stateIndex]);
      expect(header.visibleIssues).toBe(visibleIssueCounts[stateIndex]);
    }
  }
}
