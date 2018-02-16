import {
  BoardStateInitializer,
  BoardViewObservableUtil,
  HeaderStateFactory,
  IssuesFactory
} from './board-view.common.spec';
import {DeserializeIssueLookupParams} from '../../model/board/data/issue/issue.model';
import {HeaderState} from '../../model/board/data/header/header.state';
import {HeaderActions, headerMetaReducer} from '../../model/board/data/header/header.reducer';
import 'rxjs/add/operator/take';
import {IssueTable} from './issue-table';
import {List, OrderedSet, Set} from 'immutable';
import {Dictionary} from '../../common/dictionary';
import {BoardViewModel} from './board-view';
import {BoardHeader} from './board-header';
import {initialIssueDetailState} from '../../model/board/user/issue-detail/issue-detail.model';
import {BoardIssueView} from './board-issue-view';

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
      describe('All states mapped, issues in all states', () => {
        it('No rank', () => {
          doTest(false);
        });
        it('No rank', () => {
          doTest(true);
        });
        function doTest(rank: boolean) {
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
          new BoardViewObservableUtil(rank ? {view: 'rv'} : null)
            .updateBoardState(init)
            .observer()
            .take(1)
            .subscribe(board => {
              const checker: BoardChecker = new BoardChecker([['ONE-1'], ['ONE-2'], ['ONE-5', 'ONE-3', 'ONE-6'], ['ONE-4']]);
              if (rank) {
                checker.rankOrder('ONE-5', 'ONE-1', 'ONE-2', 'ONE-3', 'ONE-4', 'ONE-6');
              }
              checker.checkBoard(board);
            });
        }
      });
      describe('All states mapped, issues in some states', () => {
        it('No rank', () => {
          doTest(false);
        });
        it('Rank', () => {
          doTest(true);
        });
        function doTest(rank: boolean) {
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
          new BoardViewObservableUtil(rank ? {view: 'rv'} : null)
            .updateBoardState(init)
            .observer()
            .take(1)
            .subscribe(board => {
              const checker: BoardChecker = new BoardChecker([[], ['ONE-1', 'ONE-2'], ['ONE-5', 'ONE-3'], ['ONE-4']]);
              if (rank) {
                checker.rankOrder('ONE-5', 'ONE-1', 'ONE-2', 'ONE-3', 'ONE-4');
              }
              checker.checkBoard(board);
            });
        }
      });
      describe('All states mapped, issues in some states', () => {
        it('No rank', () => {
          doTest(false);
        });
        it('Rank', () => {
          doTest(true);
        });
        function doTest(rank: boolean) {
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
          new BoardViewObservableUtil(rank ? {view: 'rv'} : null)
            .updateBoardState(init)
            .observer()
            .take(1)
            .subscribe(board => {
              const checker: BoardChecker = new BoardChecker([[], ['ONE-1', 'ONE-2'], ['ONE-5', 'ONE-3'], ['ONE-4']]);
              if (rank) {
                checker.rankOrder('ONE-5', 'ONE-1', 'ONE-2', 'ONE-3', 'ONE-4');
              }
              checker.checkBoard(board);
            });
        }
      });
      describe('Not all states mapped, issues in all states', () => {
        it('No rank', () => {
          doTest(false);
        });
        it('Rank', () => {
          doTest(true);
        });
        function doTest(rank: boolean) {
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
          new BoardViewObservableUtil(rank ? {view: 'rv'} : null)
            .updateBoardState(init)
            .observer()
            .take(1)
            .subscribe(board => {
              const checker: BoardChecker = new BoardChecker([[], ['ONE-2', 'ONE-1'], [], ['ONE-4', 'ONE-3']])
              if (rank) {
                checker.rankOrder('ONE-4', 'ONE-3', 'ONE-2', 'ONE-1');
              }
              checker.checkBoard(board);
            });
        }
      });
    });

    describe('Two project issues', () => {
      describe('All states mapped, issues in all states', () => {
        it('No rank', () => {
          doTest(false);
        });
        it('Rank', () => {
          doTest(true);
        });
        function doTest(rank: boolean) {
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
          new BoardViewObservableUtil(rank ? {view: 'rv'} : null)
            .updateBoardState(init)
            .observer()
            .take(1)
            .subscribe(board => {
              const checker: BoardChecker = new BoardChecker([
                ['ONE-1', 'TWO-1'],
                ['ONE-2', 'TWO-2'],
                ['ONE-3', 'ONE-5', 'ONE-6', 'TWO-6', 'TWO-5', 'TWO-3'],
                ['ONE-4', 'TWO-4']]);
              if (rank) {
                checker.rankOrder(
                  'ONE-1', 'ONE-2', 'ONE-3', 'ONE-4', 'ONE-5', 'ONE-6', 'TWO-6', 'TWO-5', 'TWO-4', 'TWO-3', 'TWO-2', 'TWO-1');
              }
              checker.checkBoard(board);
            });
        }
      });
      describe('Not all states mapped, issues in all states', () => {
        it('No rank', () => {
          doTest(false);
        });
        it('Rank', () => {
          doTest(true);
        });
        function doTest(rank: boolean) {
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
          new BoardViewObservableUtil(rank ? {view: 'rv'} : null)
            .updateBoardState(init)
            .observer()
            .take(1)
            .subscribe(board => {
              const checker: BoardChecker = new BoardChecker([
                [],
                ['ONE-2', 'ONE-1'],
                ['ONE-3', 'TWO-1'],
                ['TWO-3', 'TWO-2'],
                []]);
              if (rank) {
                checker.rankOrder(
                  'ONE-3', 'ONE-2', 'ONE-1', 'TWO-3', 'TWO-2', 'TWO-1');
              }
              checker.checkBoard(board);
            });
        }
      });
    });

    describe('Issue table changes', () => {
      let util: BoardViewObservableUtil;
      let original: BoardViewModel;

      // Don't do this in beforeEach, but rather call manually from tests since it is parameterised
      function setup(rank: boolean) {
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
        util = new BoardViewObservableUtil(rank ? {view: 'rv'} : null)
          .updateBoardState(init);
        util
          .observer()
          .take(1)
          .subscribe(board => {
            const checker: BoardChecker = new BoardChecker([['ONE-1'], ['ONE-2'], ['ONE-3', 'ONE-5', 'ONE-6'], ['ONE-4', 'ONE-7']]);
            if (rank) {
              checker.rankOrder('ONE-1', 'ONE-2', 'ONE-3', 'ONE-4', 'ONE-5', 'ONE-6', 'ONE-7');
            }
            original = board;
          });
      }

      describe('Update issue detail', () => {
        it('No rank', () => {
          doTest(false);
        });
        it('Rank', () => {
          doTest(true);
        });
        function doTest(rank: boolean) {
          setup(rank);
          util
            .getBoardStateUpdater()
            .issueChanges({update: [{key: 'ONE-2', summary: 'Test summary'}]})
            .emit()
            .observer()
            .take(1)
            .subscribe(board => {
              const checker: BoardChecker = new BoardChecker([['ONE-1'], ['ONE-2'], ['ONE-3', 'ONE-5', 'ONE-6'], ['ONE-4', 'ONE-7']]);
              if (rank) {
                checker.rankOrder('ONE-1', 'ONE-2', 'ONE-3', 'ONE-4', 'ONE-5', 'ONE-6', 'ONE-7');
              }
              checker.checkBoard(board);
              expect(board.issueTable.table).not.toBe(original.issueTable.table);
              checkSameColumns(original, board, 0, 2, 3);
              const issue: BoardIssueView = board.issueTable.issues.get('ONE-2');
              expect(issue.summary).toEqual('Test summary');
              if (rank) {
                expect(board.issueTable.rankView).not.toBe(original.issueTable.rankView);
                let foundRankedIssue: BoardIssueView = null;
                board.issueTable.rankView.forEach(re => {
                  if (re.issue.key === 'ONE-2') {
                    foundRankedIssue = re.issue;
                  }
                });
                expect(foundRankedIssue).toBe(issue);
              }
              expect(board.issueTable.table.get(1).get(0)).toBe(issue);
              expect(board.headers).toBe(board.headers);
            });
        }
      });
      describe('Update issue state', () => {
        it('No rank', () => {
          doTest(false);
        });
        it('Rank', () => {
          doTest(true);
        });
        function doTest(rank: boolean) {
          setup(rank);
          util
            .getBoardStateUpdater()
            .issueChanges({update: [{key: 'ONE-5', state: '1-2'}]})
            .emit()
            .observer()
            .take(1)
            .subscribe(board => {
              const checker: BoardChecker = new BoardChecker([['ONE-1'], ['ONE-2', 'ONE-5'], ['ONE-3', 'ONE-6'], ['ONE-4', 'ONE-7']]);
              if (rank) {
                checker.rankOrder('ONE-1', 'ONE-2', 'ONE-3', 'ONE-4', 'ONE-5', 'ONE-6', 'ONE-7');
              }
              checker.checkBoard(board);
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
              const checker: BoardChecker = new BoardChecker([[], ['ONE-1', 'ONE-2', 'ONE-5'], ['ONE-3', 'ONE-6'], ['ONE-4', 'ONE-7']]);
              if (rank) {
                checker.rankOrder('ONE-1', 'ONE-2', 'ONE-3', 'ONE-4', 'ONE-5', 'ONE-6', 'ONE-7');
              }
              checker.checkBoard(board);
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
              const checker: BoardChecker = new BoardChecker([['ONE-1'], ['ONE-2', 'ONE-5'], ['ONE-3', 'ONE-6'], ['ONE-4', 'ONE-7']]);
              if (rank) {
                checker.rankOrder('ONE-1', 'ONE-2', 'ONE-3', 'ONE-4', 'ONE-5', 'ONE-6', 'ONE-7');
              }
              checker.checkBoard(board);
              checkSameColumns(original, board, 2, 3);
            });
        }
      });

      describe('Delete issue', () => {
        it('No rank', () => {
          doTest(false);
        });
        it('Rank', () => {
          doTest(true);
        });
        function doTest(rank: boolean) {
          setup(rank);
          util
            .getBoardStateUpdater()
            .issueChanges({delete: ['ONE-5']})
            .emit()
            .observer()
            .take(1)
            .subscribe(
              board => {
                const checker: BoardChecker = new BoardChecker([['ONE-1'], ['ONE-2'], ['ONE-3', 'ONE-6'], ['ONE-4', 'ONE-7']]);
                if (rank) {
                  checker.rankOrder('ONE-1', 'ONE-2', 'ONE-3', 'ONE-4', 'ONE-6', 'ONE-7');
                }
                checker.checkBoard(board);
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
                const checker: BoardChecker = new BoardChecker([[], ['ONE-2'], ['ONE-3', 'ONE-6'], ['ONE-4', 'ONE-7']]);
                if (rank) {
                  checker.rankOrder('ONE-2', 'ONE-3', 'ONE-4', 'ONE-6', 'ONE-7');
                }
                checker.checkBoard(board);
                checkSameColumns(original, board, 1, 2, 3);
                original = board;
              });
        }
      });

      describe('New issue', () => {
        describe('Main project', () => {
          it('No rank', () => {
            doTest(false);
          });
          it('Rank', () => {
            doTest(true);
          });
          function doTest(rank: boolean) {
            setup(rank);
            util
              .getBoardStateUpdater()
              .issueChanges({new: [{key: 'ONE-8', state: '1-1', summary: 'Test', priority: 'Major', type: 'task'}]})
              .rankChanges({ONE: [{index: 7, key: 'ONE-8'}]})
              .emit()
              .observer()
              .take(1)
              .subscribe(
                board => {
                  const checker: BoardChecker =
                    new BoardChecker([['ONE-1', 'ONE-8'], ['ONE-2'], ['ONE-3', 'ONE-5', 'ONE-6'], ['ONE-4', 'ONE-7']]);
                  if (rank) {
                    checker.rankOrder('ONE-1', 'ONE-2', 'ONE-3', 'ONE-4', 'ONE-5', 'ONE-6', 'ONE-7', 'ONE-8');
                  }
                  checker.checkBoard(board);
                  checkSameColumns(original, board, 1, 2, 3);
                });
          }
        });
        describe('Other project', () => {
          it('No rank', () => {
            doTest(false);
          });
          it('Rank', () => {
            doTest(true);
          });
          function doTest(rank: boolean) {
            // Don't use the standard setup here as we have another project
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
              new BoardViewObservableUtil(rank ? {view: 'rv'} : null)
                .updateBoardState(init);
            util
              .observer()
              .take(1)
              .subscribe(
                board => {
                  const checker: BoardChecker =
                    new BoardChecker([['ONE-1'], ['ONE-2'], ['ONE-3', 'ONE-5', 'ONE-6', 'TWO-1'], ['ONE-4', 'ONE-7', 'TWO-2']]);
                  if (rank) {
                    checker.rankOrder('ONE-1', 'ONE-2', 'ONE-3', 'ONE-4', 'ONE-5', 'ONE-6', 'ONE-7', 'TWO-1', 'TWO-2');
                  }
                  checker.checkBoard(board);
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
                  const checker: BoardChecker =
                    new BoardChecker([['ONE-1'], ['ONE-2'], ['ONE-3', 'ONE-5', 'ONE-6', 'TWO-1', 'TWO-3'], ['ONE-4', 'ONE-7', 'TWO-2']]);
                  if (rank) {
                    checker.rankOrder('ONE-1', 'ONE-2', 'ONE-3', 'ONE-4', 'ONE-5', 'ONE-6', 'ONE-7', 'TWO-1', 'TWO-2', 'TWO-3');
                  }
                  checker.checkBoard(board);
                  checkSameColumns(original, board, 0, 1, 3);
                });
          }
        });
      });

      describe('Rerank issue - no effect on existing states', () => {
        it('No rank', () => {
          doTest(false);
        });
        it('Rank', () => {
          doTest(true);
        });
        function doTest(rank: boolean) {
          setup(rank);
          util
            .getBoardStateUpdater()
            .rankChanges({ONE: [{index: 0, key: 'ONE-3'}]})
            .emit()
            .observer()
            .take(1)
            .subscribe(
              board => {
                // Everything should be the same in the issue table and headers
                if (rank) {
                  expect(board.issueTable.table).toBe(original.issueTable.table);
                  new BoardChecker([['ONE-1'], ['ONE-2'], ['ONE-3', 'ONE-5', 'ONE-6'], ['ONE-4', 'ONE-7']])
                    .rankOrder('ONE-3', 'ONE-1', 'ONE-2', 'ONE-4', 'ONE-5', 'ONE-6', 'ONE-7')
                    .checkBoard(board);
                } else {
                  expect(board.issueTable).toBe(original.issueTable);
                }
                expect(board.headers).toBe(original.headers);
              });
        }
      });

      describe('Rerank issue - effect on existing states', () => {
        it('No rank', () => {
          doTest(false);
        });
        it('Rank', () => {
          doTest(true);
        });
        function doTest(rank: boolean) {
          setup(rank);
          util
            .getBoardStateUpdater()
            .rankChanges({ONE: [{index: 6, key: 'ONE-3'}]})
            .emit()
            .observer()
            .take(1)
            .subscribe(
              board => {
                const checker: BoardChecker =
                  new BoardChecker([['ONE-1'], ['ONE-2'], ['ONE-5', 'ONE-6', 'ONE-3'], ['ONE-4', 'ONE-7']]);
                if (rank) {
                  checker.rankOrder('ONE-1', 'ONE-2', 'ONE-4', 'ONE-5', 'ONE-6', 'ONE-7', 'ONE-3')
                }
                checker.checkBoard(board);
                checkSameColumns(original, board, 0, 1, 3);
              });
        }
      });
    });
  });
});

describe('Issue table filter tests', () => {

  let standardTable: string[][];
  let standardRank: string[];
  beforeEach(() => {
    standardTable = [['ONE-1', 'ONE-2'], ['ONE-3', 'ONE-4', 'ONE-5'], ['ONE-6', 'ONE-7', 'ONE-8', 'ONE-9']];
    standardRank = ['ONE-1', 'ONE-2', 'ONE-3', 'ONE-4', 'ONE-5', 'ONE-6', 'ONE-7', 'ONE-8', 'ONE-9'];
  });

  // We only test filtering on priority here - we have other tests doing in-depth testing of the filters

  describe('Update filter for existing table', () => {
    it('No rank', () => {
      doTest(false);
    });
    it('Rank', () => {
      doTest(true);
    });
    function doTest(rank: boolean) {
      const util: BoardViewObservableUtil = setupTable(rank ? {view: 'rv'} : null);
      util.observer().take(1).subscribe(board => {
        const checker: BoardChecker = new BoardChecker(standardTable);
        if (rank) {
          checker.rankOrder(...standardRank);
        }
        checker.checkBoard(board);
      });

      util.getUserSettingUpdater().updateFilters('priority', 'Blocker');
      util.observer().take(1).subscribe(board => {
        const checker: BoardChecker = new BoardChecker(standardTable)
          .invisibleIssues('ONE-1', 'ONE-3', 'ONE-5', 'ONE-7', 'ONE-9');
        if (rank) {
          checker.rankOrder(...standardRank);
        }
        checker.checkBoard(board);
        // The visible issue counts are checked automatically in checkTable(), but do a sanity test here
        expect(board.headers.headersList.map(h => h.visibleIssues).toArray()).toEqual([1, 1, 2]);
      });

      util.getUserSettingUpdater().updateFilters('priority', 'Major');
      util.observer().take(1).subscribe(board => {
        const checker: BoardChecker = new BoardChecker(standardTable)
          .invisibleIssues('ONE-2', 'ONE-4', 'ONE-6', 'ONE-8');
        if (rank) {
          checker.rankOrder(...standardRank);
        }
        checker.checkBoard(board);
        // The visible issue counts are checked automatically in checkTable(), but do a sanity test here
        expect(board.headers.headersList.map(h => h.visibleIssues).toArray()).toEqual([1, 2, 2]);
      });
    }
  });
  describe('Update filter for existing table', () => {
    it('No rank', () => {
      doTest(false);
    });
    it('Rank', () => {
      doTest(true);
    });
    function doTest(rank: boolean) {
      const util: BoardViewObservableUtil = setupTable(rank ? {view: 'rv'} : null);
      util.observer().take(1).subscribe(board => {
        const checker: BoardChecker =
          new BoardChecker(standardTable);
        if (rank) {
          checker.rankOrder(...standardRank);
        }
        checker.checkBoard(board);
      });

      util.getUserSettingUpdater().updateFilters('priority', 'Blocker');
      util.observer().take(1).subscribe(board => {
        const checker: BoardChecker =
          new BoardChecker(standardTable)
          .invisibleIssues('ONE-1', 'ONE-3', 'ONE-5', 'ONE-7', 'ONE-9');
        if (rank) {
          checker.rankOrder(...standardRank);
        }
        checker.checkBoard(board);
        // The visible issue counts are checked automatically in checkTable(), but do a sanity test here
        expect(board.headers.headersList.map(h => h.visibleIssues).toArray()).toEqual([1, 1, 2]);
      });

      util.getUserSettingUpdater().updateFilters('priority', 'Major');
      util.observer().take(1).subscribe(board => {
        const checker: BoardChecker =
          new BoardChecker(standardTable)
          .invisibleIssues('ONE-2', 'ONE-4', 'ONE-6', 'ONE-8');
        if (rank) {
          checker.rankOrder(...standardRank);
        }
        checker.checkBoard(board);
        // The visible issue counts are checked automatically in checkTable(), but do a sanity test here
        expect(board.headers.headersList.map(h => h.visibleIssues).toArray()).toEqual([1, 2, 2]);
      });
    }
  });

  describe('Filter exists when creating table', () => {
    it('No rank', () => {
      doTest(false);
    });
    it('Rank', () => {
      doTest(true);
    });
    function doTest(rank: boolean) {
      const dict: Dictionary<string> = {priority: 'Major'};
      if (rank) {
        dict['view'] = 'rv';
      }
      const util: BoardViewObservableUtil = setupTable(dict);
      util.observer().take(1).subscribe(board => {
        const checker: BoardChecker =
          new BoardChecker(standardTable)
          .invisibleIssues('ONE-2', 'ONE-4', 'ONE-6', 'ONE-8');
        if (rank) {
          checker.rankOrder(...standardRank);
        }
        checker.checkBoard(board);
      });
    }
  });

  describe('Update table when filter exists ', () => {
    describe('New Issue', () => {
      describe('Matching filter', () => {
        it('No rank', () => {
          doTest(false);
        });
        it('Rank', () => {
          doTest(true);
        });
        function doTest(rank: boolean) {
          const dict: Dictionary<string> = {priority: 'Major'};
          if (rank) {
            dict['view'] = 'rv';
          }
          setupTable(dict)
            .getBoardStateUpdater()
            .issueChanges({new: [{key: 'ONE-10', state: '1-1', summary: 'Test', priority: 'Major', type: 'task'}]})
            .rankChanges({ONE: [{index: 9, key: 'ONE-10'}]})
            .emit()
            .observer().take(1).subscribe(board => {
              standardTable[0].push('ONE-10');
              const checker: BoardChecker = new BoardChecker(standardTable)
                .invisibleIssues('ONE-2', 'ONE-4', 'ONE-6', 'ONE-8');
              if (rank) {
                standardRank.push('ONE-10');
                checker.rankOrder(...standardRank);
              }
              checker.checkBoard(board);
          });
        }
      });
      describe('Not matching filter', () => {
        it('No rank', () => {
          doTest(false);
        });
        it('Rank', () => {
          doTest(true);
        });
        function doTest(rank: boolean) {
          const dict: Dictionary<string> = {priority: 'Major'};
          if (rank) {
            dict['view'] = 'rv';
          }
          setupTable(dict)
            .getBoardStateUpdater()
            .issueChanges({new: [{key: 'ONE-10', state: '1-1', summary: 'Test', priority: 'Blocker', type: 'task'}]})
            .rankChanges({ONE: [{index: 9, key: 'ONE-10'}]})
            .emit()
            .observer().take(1).subscribe(board => {
              standardTable[0].push('ONE-10');
              const checker: BoardChecker = new BoardChecker(standardTable)
                .invisibleIssues('ONE-2', 'ONE-4', 'ONE-6', 'ONE-8', 'ONE-10');
              if (rank) {
                standardRank.push('ONE-10');
                checker.rankOrder(...standardRank);
              }
              checker.checkBoard(board);
            });
        }
      });
      describe('Update Issue', () => {
        describe('Matching filter', () => {
          it('No rank', () => {
            doTest(false);
          });
          it('Rank', () => {
            doTest(true);
          });
          function doTest(rank: boolean) {
            const dict: Dictionary<string> = {priority: 'Major'};
            if (rank) {
              dict['view'] = 'rv';
            }
            setupTable(dict)
              .getBoardStateUpdater()
              .issueChanges({update: [{key: 'ONE-2', priority: 'Major'}]})
              .emit()
              .observer().take(1).subscribe(board => {
              const checker: BoardChecker = new BoardChecker(standardTable)
                .invisibleIssues('ONE-4', 'ONE-6', 'ONE-8');
              if (rank) {
                checker.rankOrder(...standardRank);
              }
              checker.checkBoard(board);
            });
          }
        });
        describe('Not matching filter', () => {
          it('No rank', () => {
            doTest(false);
          });
          it('Rank', () => {
            doTest(true);
          });
          function doTest(rank: boolean) {
            const dict: Dictionary<string> = {priority: 'Major'};
            if (rank) {
              dict['view'] = 'rv';
            }
            setupTable(dict)
              .getBoardStateUpdater()
              .issueChanges({update: [{key: 'ONE-1', priority: 'Blocker'}]})
              .emit()
              .observer().take(1).subscribe(board => {
              const checker: BoardChecker = new BoardChecker(standardTable)
                .invisibleIssues('ONE-1', 'ONE-2', 'ONE-4', 'ONE-6', 'ONE-8');
              if (rank) {
                checker.rankOrder(...standardRank);
              }
              checker.checkBoard(board);
            });
          }
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
      .updateBoardState(init);

    return util;
  }
});

describe('Switch View Mode (effect on Backlog) Tests', () => {
  // The key thing here is that when bringing in the backlog the BoardComponent makes another call to fetch the backlog
  // data from the server
  let util: BoardViewObservableUtil;
  let last: BoardViewModel;
  describe('Initial kanban view', () => {
    describe('Backlog initially hidden', () => {

      it ('Switch view', () => {
        util = setupTable(false);
        util.observer().take(1).subscribe(board => {
          new BoardChecker([[], ['ONE-3', 'ONE-4'], ['ONE-5', 'ONE-6']])
            .checkBoard(board);
          last = board;
        });

        // Go to Rank View
        util.getUserSettingUpdater().switchViewMode()
          .observer().take(1).subscribe(board => {
          // We need the new deserialized data to actually trigger the new view model when showing/hiding the backlog
          expect(board).toBe(last);
        });
        // The caller (BoardComponent) does a full refresh (since we need the backlog)
        util.updateBoardState(createInitializer(true))
          .observer().take(1).subscribe(board => {
          expect(board).not.toBe(last);
          new BoardChecker([['ONE-1', 'ONE-2'], ['ONE-3', 'ONE-4'], ['ONE-5', 'ONE-6']])
            .rankOrder('ONE-1', 'ONE-2', 'ONE-3', 'ONE-4', 'ONE-5', 'ONE-6')
            .checkBoard(board);
          expect(board).not.toBe(last);
          checkSameColumns(last, board, 1, 2);
          last = board;
        });

        // Go to Kanban view again
        util.getUserSettingUpdater().switchViewMode()
          .observer().take(1).subscribe(board => {
          // We need the new deserialized data to actually trigger the new view model when showing/hiding the backlog
          expect(board).toBe(last);
        });
        // The caller (BoardComponent) does a full refresh (since we need to unload the backlog)
        util.updateBoardState(createInitializer(false))
          .observer().take(1).subscribe(board => {
          expect(board).not.toBe(last);
          new BoardChecker([[], ['ONE-3', 'ONE-4'], ['ONE-5', 'ONE-6']])
            .checkBoard(board);
          checkSameColumns(last, board, 1, 2);
          last = board;
        });
      });

      it ('Toggle backlog', () => {
        util = setupTable(false);
        util.observer().take(1).subscribe(board => {
          new BoardChecker([[], ['ONE-3', 'ONE-4'], ['ONE-5', 'ONE-6']])
            .checkBoard(board);
          last = board;
        });

        // Set the backlog to true
        util.getUserSettingUpdater().toggleBacklog()
          .observer().take(1).subscribe(board => {
          // We need the new deserialized data to actually trigger the new view model
          expect(board).toBe(last);
        });
        // The caller (BoardComponent) does a full refresh (since we need to load the backlog)
        util.updateBoardState(createInitializer(true))
          .observer().take(1).subscribe(board => {
          expect(board).not.toBe(last);
          new BoardChecker([['ONE-1', 'ONE-2'], ['ONE-3', 'ONE-4'], ['ONE-5', 'ONE-6']])
            .checkBoard(board);
          expect(board).not.toBe(last);
          checkSameColumns(last, board, 1, 2);
          last = board;
        });

        // Set the backlog to false again
        util.getUserSettingUpdater().toggleBacklog()
          .observer().take(1).subscribe(board => {
          // We need the new deserialized data to actually trigger the new view model
          expect(board.issueTable).toBe(last.issueTable);
        });
        // The caller (BoardComponent) does a full refresh (since we need to unload the backlog)
        util.updateBoardState(createInitializer(false))
          .observer().take(1).subscribe(board => {
          expect(board).not.toBe(last);
          new BoardChecker([[], ['ONE-3', 'ONE-4'], ['ONE-5', 'ONE-6']])
            .checkBoard(board);
          checkSameColumns(last, board, 1, 2);
          last = board;
        });
      });
    });

    describe('Backlog initially visible', () => {
      it ('Switch view', () => {
        // Start off with rank view which forces the backlog
        util = setupTable(true, {bl: 'true'});
        util.observer().take(1).subscribe(board => {
          new BoardChecker([['ONE-1', 'ONE-2'], ['ONE-3', 'ONE-4'], ['ONE-5', 'ONE-6']])
            .checkBoard(board);
          last = board;
        });

        // Switching to rankview should just use the same issue table since we are not
        // changing the backlog visibility
        util.getUserSettingUpdater().switchViewMode()
          .observer().take(1).subscribe(board => {
          expect(board).not.toBe(last);
          new BoardChecker([['ONE-1', 'ONE-2'], ['ONE-3', 'ONE-4'], ['ONE-5', 'ONE-6']])
            .rankOrder('ONE-1', 'ONE-2', 'ONE-3', 'ONE-4', 'ONE-5', 'ONE-6')
            .checkBoard(board);
          expect(board).not.toBe(last);
          expect(board.issueTable.table).toBe(last.issueTable.table);
          last = board;
        });

        // Switching back to kanban should just use the same issue table since we are not
        // changing the backlog visibility
        util.getUserSettingUpdater().switchViewMode()
          .observer().take(1).subscribe(board => {
          expect(board).not.toBe(last);
          new BoardChecker([['ONE-1', 'ONE-2'], ['ONE-3', 'ONE-4'], ['ONE-5', 'ONE-6']])
            .checkBoard(board);
          expect(board).not.toBe(last);
          expect(board.issueTable.table).toBe(last.issueTable.table);
          last = board;
        });
      });

      it ('Toggle backlog', () => {
        util = setupTable(true, {bl: 'true'});
        util.observer().take(1).subscribe(board => {
          new BoardChecker([['ONE-1', 'ONE-2'], ['ONE-3', 'ONE-4'], ['ONE-5', 'ONE-6']])
            .checkBoard(board);
          last = board;
        });

        // Set the backlog to false
        util.getUserSettingUpdater().toggleBacklog()
          .observer().take(1).subscribe(board => {
          // We need the new deserialized data to actually trigger the new view model
          expect(board.issueTable).toBe(last.issueTable);
        });
        // The caller (BoardComponent) does a full refresh (since we need to unload the backlog)
        util.updateBoardState(createInitializer(false))
          .observer().take(1).subscribe(board => {
          expect(board).not.toBe(last);
          new BoardChecker([[], ['ONE-3', 'ONE-4'], ['ONE-5', 'ONE-6']])
            .checkBoard(board);
          checkSameColumns(last, board, 1, 2);
          last = board;
        });

        // Set the backlog to true
        util.getUserSettingUpdater().toggleBacklog()
          .observer().take(1).subscribe(board => {
          // We need the new deserialized data to actually trigger the new view model
          expect(board).toBe(last);
        });
        // The caller (BoardComponent) does a full refresh (since we need to load the backlog)
        util.updateBoardState(createInitializer(true))
          .observer().take(1).subscribe(board => {
          expect(board).not.toBe(last);
          new BoardChecker([['ONE-1', 'ONE-2'], ['ONE-3', 'ONE-4'], ['ONE-5', 'ONE-6']])
            .checkBoard(board);
          expect(board).not.toBe(last);
          checkSameColumns(last, board, 1, 2);
          last = board;
        });
      });
    });
  });

  it('Initial rank view', () => {
    // We start with rank view and a forced backlog
    util = setupTable(true, {view: 'rv'});
    util.observer().take(1).subscribe(board => {
      new BoardChecker([['ONE-1', 'ONE-2'], ['ONE-3', 'ONE-4'], ['ONE-5', 'ONE-6']])
        .rankOrder('ONE-1', 'ONE-2', 'ONE-3', 'ONE-4', 'ONE-5', 'ONE-6')
        .checkBoard(board);
      last = board;
    });

    // Go to Kanban and discard rankview
    util.getUserSettingUpdater().switchViewMode()
      .observer().take(1).subscribe(board => {
      // We need the new deserialized data to actually trigger the new view model when showing/hiding the backlog
      expect(board).toBe(last);
    });
    // The caller (BoardComponent) does a full refresh (since we need to unload the backlog)
    util.updateBoardState(createInitializer(false))
      .observer().take(1).subscribe(board => {
      expect(board).not.toBe(last);
      new BoardChecker([[], ['ONE-3', 'ONE-4'], ['ONE-5', 'ONE-6']])
        .checkBoard(board);
      checkSameColumns(last, board, 1, 2);
      last = board;
    });

    util.getUserSettingUpdater().switchViewMode()
      .observer().take(1).subscribe(board => {
      // We need the new deserialized data to actually trigger the new view model
        expect(board).toBe(last);
    });
    // Push the loaded board state with the backlog data, which is what the component would do when we
    // don't have the backlog data
    util.updateBoardState(createInitializer(true))
      .observer().take(1).subscribe(board => {
      expect(board).not.toBe(last);
      new BoardChecker([['ONE-1', 'ONE-2'], ['ONE-3', 'ONE-4'], ['ONE-5', 'ONE-6']])
        .rankOrder('ONE-1', 'ONE-2', 'ONE-3', 'ONE-4', 'ONE-5', 'ONE-6')
        .checkBoard(board);
      checkSameColumns(last, board, 1, 2);
      last = board;
    });

  });

  function createInitializer(loadBacklog: boolean): BoardStateInitializer {
    const init =
      new BoardStateInitializer('ONE')
        .headerStateFactory(new BacklogStateFactory(3))
        .mapState('ONE', 'S-1', '1-1')
        .mapState('ONE', 'S-2', '1-2')
        .mapState('ONE', 'S-3', '1-3');
    if (loadBacklog) {
      init.setRank('ONE', 1, 2, 3, 4, 5, 6)
    } else {
      init.setRank('ONE', 3, 4, 5, 6)
    };
    const issueFactory: SimpleIssueFactory = new SimpleIssueFactory();
    if (loadBacklog) {
      issueFactory
        .addIssue('ONE-1', 0)
        .addIssue('ONE-2', 0);
    };
    issueFactory
      .addIssue('ONE-3', 1)
      .addIssue('ONE-4', 1)
      .addIssue('ONE-5', 2)
      .addIssue('ONE-6', 2);
    init.issuesFactory(issueFactory);
    return init;
  }

  function setupTable(loadBacklog: boolean, params?: Dictionary<string>): BoardViewObservableUtil {
    return new BoardViewObservableUtil(params)
      .updateBoardState(createInitializer(loadBacklog));
  }
});

function checkSameColumns(oldState: BoardViewModel, newState: BoardViewModel, ...cols: number[]) {
  const oldTable: List<List<BoardIssueView>> = oldState.issueTable.table;
  const newTable: List<List<BoardIssueView>> = newState.issueTable.table;

  const expectedEqual: OrderedSet<number> = OrderedSet<number>(cols);
  expect(oldTable.size).toBe(newTable.size);
  for (let i = 0 ; i < oldTable.size ; i++) {
    const oldCol: List<BoardIssueView> = oldTable.get(i);
    const newCol: List<BoardIssueView> = newTable.get(i);
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

class BacklogStateFactory extends NumberedHeaderStateFactory {
  constructor(numStates: number) {
    super(numStates);
  }

  getBacklog() {
    return 1;
  }
}

class BoardChecker {
  private _invisibleIssues: string[] = [];
  private _rankOrder: string[] = null;

  constructor(private _expected: string[][]) {
  }

  invisibleIssues(...invisible: string[]): BoardChecker {
    this._invisibleIssues = invisible;
    return this;
  }

  rankOrder(...rankOrder: string[]): BoardChecker {
    this._rankOrder = rankOrder;
    return this;
  }

  checkBoard(board: BoardViewModel) {
    // Get rid of all the invisible issues from the 'expected' table
    const invisibleIssueSet: Set<string> = Set<string>(this._invisibleIssues);
    const expectedVisible: string[][] = this._expected.map(
      col => col.filter(k => !invisibleIssueSet.contains(k)))

    // We are not changing the issue details in this test
    expect(board.issueDetail).toBe(initialIssueDetailState);

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
    expect(invisibleKeys).toEqual(this._invisibleIssues.sort((a, b) => a.localeCompare(b)));

    // Check issue counts
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

    if (!this._rankOrder) {
      expect(issueTable.rankView.size).toBe(0);
    } else {
      const expectedVisibleRank: string[] = this._rankOrder.filter(k => !invisibleIssueSet.contains(k));
      // Work out the board index from the issue table
      const issueDictionary: Dictionary<number> = {}
      issueTable.table.forEach((state, boardIndex) => {
        state.forEach(issue => issueDictionary[issue.key] = boardIndex);
      });
      expect(issueTable.rankView.map(re => re.issue.key).toArray()).toEqual(expectedVisibleRank);
      issueTable.rankView.forEach(re => expect(re.boardIndex).toBe((issueDictionary[re.issue.key])));
    }
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
