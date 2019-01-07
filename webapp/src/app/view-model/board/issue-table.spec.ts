import {BoardStateInitializer, BoardViewObservableUtil, HeaderStateFactory, IssuesFactory} from './board-view.common.spec';
import {DeserializeIssueLookupParams} from '../../model/board/data/issue/issue.model';
import {HeaderState} from '../../model/board/data/header/header.state';
import {HeaderActions, headerMetaReducer} from '../../model/board/data/header/header.reducer';
import {IssueTable} from './issue-table';
import {List, OrderedSet, Set} from 'immutable';
import {Dictionary} from '../../common/dictionary';
import {BoardViewModel} from './board-view';
import {BoardHeader} from './board-header';
import {initialIssueDetailState, IssueDetailState} from '../../model/board/user/issue-detail/issue-detail.model';
import {BoardIssueView} from './board-issue-view';
import {IssueSummaryLevel} from '../../model/board/user/issue-summary-level';

describe('Issue Table observer tests', () => {

  let issueFactory: SimpleIssueFactory;
  let headerFactory: HeaderStateFactory;
  let init: BoardStateInitializer;

  beforeEach(() => {
    issueFactory = new SimpleIssueFactory();
    headerFactory = new NumberedHeaderStateFactory(4);
    init =
      new BoardStateInitializer()
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
            .easySubscribe(board => {
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
            .easySubscribe(board => {
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
            .easySubscribe(board => {
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
            new BoardStateInitializer()
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
            .easySubscribe(board => {
              const checker: BoardChecker = new BoardChecker([[], ['ONE-2', 'ONE-1'], [], ['ONE-4', 'ONE-3']]);
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
            .easySubscribe(board => {
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
            new BoardStateInitializer()
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
            .easySubscribe(board => {
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
          new BoardStateInitializer()
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
          .easySubscribe(board => {
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
            .easySubscribe(board => {
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
            .easySubscribe(board => {
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
            .easySubscribe(board => {
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
            .easySubscribe(board => {
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
            .easySubscribe(
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
            .easySubscribe(
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
              .easySubscribe(
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
              new BoardStateInitializer()
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
              .easySubscribe(
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
              .easySubscribe(
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
            .easySubscribe(
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
            .easySubscribe(
              board => {
                const checker: BoardChecker =
                  new BoardChecker([['ONE-1'], ['ONE-2'], ['ONE-5', 'ONE-6', 'ONE-3'], ['ONE-4', 'ONE-7']]);
                if (rank) {
                  checker.rankOrder('ONE-1', 'ONE-2', 'ONE-4', 'ONE-5', 'ONE-6', 'ONE-7', 'ONE-3');
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
      util.easySubscribe(board => {
        const checker: BoardChecker = new BoardChecker(standardTable);
        if (rank) {
          checker.rankOrder(...standardRank);
        }
        checker.checkBoard(board);
      });

      util.getUserSettingUpdater().updateFilters('priority', 'Blocker');
      util.easySubscribe(board => {
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
      util.easySubscribe(board => {
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
      util.easySubscribe(board => {
        const checker: BoardChecker =
          new BoardChecker(standardTable);
        if (rank) {
          checker.rankOrder(...standardRank);
        }
        checker.checkBoard(board);
      });

      util.getUserSettingUpdater().updateFilters('priority', 'Blocker');
      util.easySubscribe(board => {
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
      util.easySubscribe(board => {
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
      util.easySubscribe(board => {
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
            .easySubscribe(board => {
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
            .easySubscribe(board => {
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
              .easySubscribe(board => {
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
              .easySubscribe(board => {
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

  describe('Update issue details when filters exist', () => {
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
      util.easySubscribe(board => {
        const checker: BoardChecker =
          new BoardChecker(standardTable)
            .invisibleIssues('ONE-2', 'ONE-4', 'ONE-6', 'ONE-8');
        if (rank) {
          checker.rankOrder(...standardRank);
        }
        checker.checkBoard(board);
      });

      // Now update the issue details and check that it is all the same
      util.getUserSettingUpdater().updateIssueSummaryLevel(IssueSummaryLevel.SHORT_SUMMARY_NO_AVATAR);
      util.easySubscribe(board => {
        const checker: BoardChecker =
          new BoardChecker(standardTable)
            .invisibleIssues('ONE-2', 'ONE-4', 'ONE-6', 'ONE-8')
            .issueDetailState({
              issueSummaryLevel: IssueSummaryLevel.SHORT_SUMMARY_NO_AVATAR,
              linkedIssues: true,
              parallelTasks: true
            });
        if (rank) {
          checker.rankOrder(...standardRank);
        }
        checker.checkBoard(board);
      });
    }
  });

  function setupTable(params?: Dictionary<string>): BoardViewObservableUtil {
    const init =
      new BoardStateInitializer()
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

describe ('Issue table search filter', () => {

  let standardTable: string[][];
  let standardRank: string[];
  beforeEach(() => {
    standardTable = [['ONE-1', 'ONE-2'], ['ONE-3', 'ONE-4'], ['ONE-5', 'ONE-6']];
    standardRank = ['ONE-1', 'ONE-2', 'ONE-3', 'ONE-4', 'ONE-5', 'ONE-6'];
  });

  describe('Not hidden', () => {
    describe('Issue IDs', () => {
      it ('No rank', () => {
        doTest(false);
      });

      it ('Rank', () => {
        doTest(true);
      });

      function doTest(rank: boolean) {
        const util: BoardViewObservableUtil = setupTable(rank ? {view: 'rv'} : null);
        util.easySubscribe(board => {
          const checker: BoardChecker = new BoardChecker(standardTable);
          if (rank) {
            checker.rankOrder(...standardRank);
          }
          checker.checkBoard(board);

        });
        util.getUserSettingUpdater().updateSearchIssueIds('ONE-2');
        util.easySubscribe(board => {
          const checker: BoardChecker = new BoardChecker(standardTable);
          if (rank) {
            checker.rankOrder(...standardRank);
          }
          checker
            .nonMatchingIssues('ONE-1', 'ONE-3', 'ONE-4', 'ONE-5', 'ONE-6')
            .checkBoard(board);
        });
        util.getUserSettingUpdater().updateSearchIssueIds('ONE-2', 'ONE-4');
        util.easySubscribe(board => {
          const checker: BoardChecker = new BoardChecker(standardTable);
          if (rank) {
            checker.rankOrder(...standardRank);
          }
          checker
            .nonMatchingIssues('ONE-1', 'ONE-3', 'ONE-5', 'ONE-6')
            .checkBoard(board);
        });
        util.getUserSettingUpdater().updateSearchIssueIds('ONE-4');
        util.easySubscribe(board => {
          const checker: BoardChecker = new BoardChecker(standardTable);
          if (rank) {
            checker.rankOrder(...standardRank);
          }
          checker
            .nonMatchingIssues('ONE-1', 'ONE-2', 'ONE-3', 'ONE-5', 'ONE-6')
            .checkBoard(board);
        });
        util.getUserSettingUpdater().updateSearchIssueIds();
        util.easySubscribe(board => {
          const checker: BoardChecker = new BoardChecker(standardTable);
          if (rank) {
            checker.rankOrder(...standardRank);
          }
          checker
            .checkBoard(board);
        });
      }
    });

    describe('Containing text', () => {
      it ('No Rank', () => {
        doTest(false);
      });
      it ('Rank', () => {
        doTest(true);
      });

      function doTest(rank: boolean) {
        const util: BoardViewObservableUtil = setupTable(rank ? {view: 'rv'} : null);
        util.easySubscribe(board => {
          const checker: BoardChecker = new BoardChecker(standardTable);
          if (rank) {
            checker.rankOrder(...standardRank);
          }
          checker
            .checkBoard(board);
        });
        util.getUserSettingUpdater().updateSearchContainingText('IssUe ##');
        util.easySubscribe(board => {
          const checker: BoardChecker = new BoardChecker(standardTable);
          if (rank) {
            checker.rankOrder(...standardRank);
          }
          checker
            .checkBoard(board);
        });
        util.getUserSettingUpdater().updateSearchContainingText('##1');
        util.easySubscribe(board => {
          const checker: BoardChecker = new BoardChecker(standardTable);
          if (rank) {
            checker.rankOrder(...standardRank);
          }
          checker
            .nonMatchingIssues('ONE-2', 'ONE-4', 'ONE-6')
            .checkBoard(board);
        });
        util.getUserSettingUpdater().updateSearchContainingText('##12');
        util.easySubscribe(board => {
          const checker: BoardChecker = new BoardChecker(standardTable);
          if (rank) {
            checker.rankOrder(...standardRank);
          }
          checker
            .nonMatchingIssues('ONE-1', 'ONE-2', 'ONE-4', 'ONE-5', 'ONE-6')
            .checkBoard(board);
        });
        util.getUserSettingUpdater().updateSearchContainingText('##1');
        util.easySubscribe(board => {
          const checker: BoardChecker = new BoardChecker(standardTable);
          if (rank) {
            checker.rankOrder(...standardRank);
          }
          checker
            .nonMatchingIssues('ONE-2', 'ONE-4', 'ONE-6')
            .checkBoard(board);
        });
        util.getUserSettingUpdater().updateSearchContainingText('##');
        util.easySubscribe(board => {
          const checker: BoardChecker = new BoardChecker(standardTable);
          if (rank) {
            checker.rankOrder(...standardRank);
          }
          checker
            .checkBoard(board);
        });
        util.getUserSettingUpdater().updateSearchContainingText('##2');
        util.easySubscribe(board => {
          const checker: BoardChecker = new BoardChecker(standardTable);
          if (rank) {
            checker.rankOrder(...standardRank);
          }
          checker
            .nonMatchingIssues('ONE-1', 'ONE-3', 'ONE-5')
            .checkBoard(board);
        });
      }
    });

    describe('Issue ids and text', () => {
      it ('No Rank', () => {
        doTest(false);
      });
      it ('Rank', () => {
        doTest(true);
      });

      function doTest(rank: boolean) {
        const util: BoardViewObservableUtil = setupTable(rank ? {view: 'rv'} : null);
        util.getUserSettingUpdater().updateSearchIssueIds('ONE-1', 'ONE-2', 'ONE-3');
        util.easySubscribe(board => {
          const checker: BoardChecker = new BoardChecker(standardTable);
          if (rank) {
            checker.rankOrder(...standardRank);
          }
          checker
            .nonMatchingIssues('ONE-4', 'ONE-5', 'ONE-6')
            .checkBoard(board);

        });
        util.getUserSettingUpdater().updateSearchContainingText('##1');
        util.easySubscribe(board => {
          const checker: BoardChecker = new BoardChecker(standardTable);
          if (rank) {
            checker.rankOrder(...standardRank);
          }
          checker
            .nonMatchingIssues('ONE-2', 'ONE-4', 'ONE-5', 'ONE-6')
            .checkBoard(board);
        });
        util.getUserSettingUpdater().updateSearchContainingText('##12');
        util.easySubscribe(board => {
          const checker: BoardChecker = new BoardChecker(standardTable);
          if (rank) {
            checker.rankOrder(...standardRank);
          }
          checker
            .nonMatchingIssues('ONE-1', 'ONE-2', 'ONE-4', 'ONE-5', 'ONE-6')
            .checkBoard(board);
        });
        util.getUserSettingUpdater().updateSearchContainingText('##1');
        util.easySubscribe(board => {
          const checker: BoardChecker = new BoardChecker(standardTable);
          if (rank) {
            checker.rankOrder(...standardRank);
          }
          checker
            .nonMatchingIssues('ONE-2', 'ONE-4', 'ONE-5', 'ONE-6')
            .checkBoard(board);
        });
        util.getUserSettingUpdater().updateSearchIssueIds('ONE-2');
        util.easySubscribe(board => {
          const checker: BoardChecker = new BoardChecker(standardTable);
          if (rank) {
            checker.rankOrder(...standardRank);
          }
          checker
            .nonMatchingIssues('ONE-1', 'ONE-2', 'ONE-3', 'ONE-4', 'ONE-5', 'ONE-6')
            .checkBoard(board);
        });
        util.getUserSettingUpdater().updateSearchContainingText('##');
        util.easySubscribe(board => {
          const checker: BoardChecker = new BoardChecker(standardTable);
          if (rank) {
            checker.rankOrder(...standardRank);
          }
          checker
            .nonMatchingIssues('ONE-1', 'ONE-3', 'ONE-4', 'ONE-5', 'ONE-6')
            .checkBoard(board);
        });
        util.getUserSettingUpdater().updateSearchIssueIds('ONE-2', 'ONE-6');
        util.easySubscribe(board => {
          const checker: BoardChecker = new BoardChecker(standardTable);
          if (rank) {
            checker.rankOrder(...standardRank);
          }
          checker
            .nonMatchingIssues('ONE-1', 'ONE-3', 'ONE-4', 'ONE-5')
            .checkBoard(board);
        });
      }
    });

    describe('IssueQl', () => {
      it ('No Rank', () => {
        doTest(false);
      });
      it ('Rank', () => {
        doTest(true);
      });

      function doTest(rank: boolean) {
        const util: BoardViewObservableUtil = setupTable(rank ? {view: 'rv'} : null);
        util.easySubscribe(board => {
          const checker: BoardChecker = new BoardChecker(standardTable);
          if (rank) {
            checker.rankOrder(...standardRank);
          }
          checker
            .checkBoard(board);
        });
        util.getUserSettingUpdater().updateSearchIssueQl('priority="Blocker"');
        util.easySubscribe(board => {
          const checker: BoardChecker = new BoardChecker(standardTable);
          if (rank) {
            checker.rankOrder(...standardRank);
          }
          checker
            .nonMatchingIssues('ONE-1', 'ONE-3', 'ONE-5')
            .checkBoard(board);
        });
        util.getUserSettingUpdater().updateSearchIssueQl('assignee IS EMPTY');
        util.easySubscribe(board => {
          const checker: BoardChecker = new BoardChecker(standardTable);
          if (rank) {
            checker.rankOrder(...standardRank);
          }
          checker
            .checkBoard(board);
        });
      }
    });
  });

  describe('Hidden', () => {
    describe('Issue IDs', () => {
      it ('No Rank', () => {
        doTest(false);
      });
      it ('Rank', () => {
        doTest(true);
      });

      function doTest(rank: boolean) {
        const util: BoardViewObservableUtil = setupTable(rank ? {view: 'rv'} : null);
        util.getUserSettingUpdater().updateSearchHideNonMatching(true);
        util.easySubscribe(board => {
          const checker: BoardChecker = new BoardChecker(standardTable);
          if (rank) {
            checker.rankOrder(...standardRank);
          }
          checker
            .checkBoard(board);

        });
        util.getUserSettingUpdater().updateSearchIssueIds('ONE-2');
        util.easySubscribe(board => {
          const checker: BoardChecker = new BoardChecker(standardTable);
          if (rank) {
            checker.rankOrder(...standardRank);
          }
          checker
            .invisibleIssues('ONE-1', 'ONE-3', 'ONE-4', 'ONE-5', 'ONE-6')
            .checkBoard(board);
        });
        util.getUserSettingUpdater().updateSearchIssueIds('ONE-2', 'ONE-4');
        util.easySubscribe(board => {
          const checker: BoardChecker = new BoardChecker(standardTable);
          if (rank) {
            checker.rankOrder(...standardRank);
          }
          checker
            .invisibleIssues('ONE-1', 'ONE-3', 'ONE-5', 'ONE-6')
            .checkBoard(board);

        });
        util.getUserSettingUpdater().updateSearchIssueIds('ONE-4');
        util.easySubscribe(board => {
          const checker: BoardChecker = new BoardChecker(standardTable);
          if (rank) {
            checker.rankOrder(...standardRank);
          }
          checker
            .invisibleIssues('ONE-1', 'ONE-2', 'ONE-3', 'ONE-5', 'ONE-6')
            .checkBoard(board);

        });
        util.getUserSettingUpdater().updateSearchIssueIds();
        util.easySubscribe(board => {
          const checker: BoardChecker = new BoardChecker(standardTable);
          if (rank) {
            checker.rankOrder(...standardRank);
          }
          checker
            .checkBoard(board);
        });
      }
    });

    describe('Containing text', () => {
      it ('No Rank', () => {
        doTest(false);
      });
      it ('Rank', () => {
        doTest(true);
      });

      function doTest(rank: boolean) {
        const util: BoardViewObservableUtil = setupTable(rank ? {view: 'rv'} : null);
        util.getUserSettingUpdater().updateSearchHideNonMatching(true);
        util.easySubscribe(board => {
          const checker: BoardChecker = new BoardChecker(standardTable);
          if (rank) {
            checker.rankOrder(...standardRank);
          }
          checker
            .checkBoard(board);
        });
        util.getUserSettingUpdater().updateSearchContainingText('IssUe ##');
        util.easySubscribe(board => {
          const checker: BoardChecker = new BoardChecker(standardTable);
          if (rank) {
            checker.rankOrder(...standardRank);
          }
          checker
            .checkBoard(board);
        });
        util.getUserSettingUpdater().updateSearchContainingText('##1');
        util.easySubscribe(board => {
          const checker: BoardChecker = new BoardChecker(standardTable);
          if (rank) {
            checker.rankOrder(...standardRank);
          }
          checker
            .invisibleIssues('ONE-2', 'ONE-4', 'ONE-6')
            .checkBoard(board);
        });
        util.getUserSettingUpdater().updateSearchContainingText('##12');
        util.easySubscribe(board => {
          const checker: BoardChecker = new BoardChecker(standardTable);
          if (rank) {
            checker.rankOrder(...standardRank);
          }
          checker
            .invisibleIssues('ONE-1', 'ONE-2', 'ONE-4', 'ONE-5', 'ONE-6')
            .checkBoard(board);
        });
        util.getUserSettingUpdater().updateSearchContainingText('##1');
        util.easySubscribe(board => {
          const checker: BoardChecker = new BoardChecker(standardTable);
          if (rank) {
            checker.rankOrder(...standardRank);
          }
          checker
            .invisibleIssues('ONE-2', 'ONE-4', 'ONE-6')
            .checkBoard(board);
        });
        util.getUserSettingUpdater().updateSearchContainingText('##');
        util.easySubscribe(board => {
          const checker: BoardChecker = new BoardChecker(standardTable);
          if (rank) {
            checker.rankOrder(...standardRank);
          }
          checker
            .checkBoard(board);
        });
        util.getUserSettingUpdater().updateSearchContainingText('##2');
        util.easySubscribe(board => {
          const checker: BoardChecker = new BoardChecker(standardTable);
          if (rank) {
            checker.rankOrder(...standardRank);
          }
          checker
            .invisibleIssues('ONE-1', 'ONE-3', 'ONE-5')
            .checkBoard(board);
        });
      }
    });

    describe('Issue ids and text', () => {
      it ('No Rank', () => {
        doTest(false);
      });
      it ('Rank', () => {
        doTest(true);
      });

      function doTest(rank: boolean) {
        const util: BoardViewObservableUtil = setupTable(rank ? {view: 'rv'} : null);
        util.getUserSettingUpdater().updateSearchHideNonMatching(true);
        util.getUserSettingUpdater().updateSearchIssueIds('ONE-1', 'ONE-2', 'ONE-3');
        util.easySubscribe(board => {
          const checker: BoardChecker = new BoardChecker(standardTable);
          if (rank) {
            checker.rankOrder(...standardRank);
          }
          checker
            .invisibleIssues('ONE-4', 'ONE-5', 'ONE-6')
            .checkBoard(board);
        });
        util.getUserSettingUpdater().updateSearchContainingText('##1');
        util.easySubscribe(board => {
          const checker: BoardChecker = new BoardChecker(standardTable);
          if (rank) {
            checker.rankOrder(...standardRank);
          }
          checker
            .invisibleIssues('ONE-2', 'ONE-4', 'ONE-5', 'ONE-6')
            .checkBoard(board);
        });
        util.getUserSettingUpdater().updateSearchContainingText('##12');
        util.easySubscribe(board => {
          const checker: BoardChecker = new BoardChecker(standardTable);
          if (rank) {
            checker.rankOrder(...standardRank);
          }
          checker
            .invisibleIssues('ONE-1', 'ONE-2', 'ONE-4', 'ONE-5', 'ONE-6')
            .checkBoard(board);
        });
        util.getUserSettingUpdater().updateSearchContainingText('##1');
        util.easySubscribe(board => {
          const checker: BoardChecker = new BoardChecker(standardTable);
          if (rank) {
            checker.rankOrder(...standardRank);
          }
          checker
            .invisibleIssues('ONE-2', 'ONE-4', 'ONE-5', 'ONE-6')
            .checkBoard(board);
        });
        util.getUserSettingUpdater().updateSearchIssueIds('ONE-2');
        util.easySubscribe(board => {
          const checker: BoardChecker = new BoardChecker(standardTable);
          if (rank) {
            checker.rankOrder(...standardRank);
          }
          checker
            .invisibleIssues('ONE-1', 'ONE-2', 'ONE-3', 'ONE-4', 'ONE-5', 'ONE-6')
            .checkBoard(board);
        });
        util.getUserSettingUpdater().updateSearchContainingText('##');
        util.easySubscribe(board => {
          const checker: BoardChecker = new BoardChecker(standardTable);
          if (rank) {
            checker.rankOrder(...standardRank);
          }
          checker
            .invisibleIssues('ONE-1', 'ONE-3', 'ONE-4', 'ONE-5', 'ONE-6')
            .checkBoard(board);
        });
        util.getUserSettingUpdater().updateSearchIssueIds('ONE-2', 'ONE-6');
        util.easySubscribe(board => {
          const checker: BoardChecker = new BoardChecker(standardTable);
          if (rank) {
            checker.rankOrder(...standardRank);
          }
          checker
            .invisibleIssues('ONE-1', 'ONE-3', 'ONE-4', 'ONE-5')
            .checkBoard(board);
        });
      }
    });

    describe('IssueQl', () => {
      it ('No Rank', () => {
        doTest(false);
      });
      it ('Rank', () => {
        doTest(true);
      });

      function doTest(rank: boolean) {
        const util: BoardViewObservableUtil = setupTable(rank ? {view: 'rv'} : null);
        util.getUserSettingUpdater().updateSearchHideNonMatching(true);
        util.easySubscribe(board => {
          const checker: BoardChecker = new BoardChecker(standardTable);
          if (rank) {
            checker.rankOrder(...standardRank);
          }
          checker
            .checkBoard(board);
        });
        util.getUserSettingUpdater().updateSearchIssueQl('priority="Blocker"');
        util.easySubscribe(board => {
          const checker: BoardChecker = new BoardChecker(standardTable);
          if (rank) {
            checker.rankOrder(...standardRank);
          }
          checker
            .invisibleIssues('ONE-1', 'ONE-3', 'ONE-5')
            .checkBoard(board);
        });
        util.getUserSettingUpdater().updateSearchIssueQl('assignee IS EMPTY');
        util.easySubscribe(board => {
          const checker: BoardChecker = new BoardChecker(standardTable);
          if (rank) {
            checker.rankOrder(...standardRank);
          }
          checker
            .checkBoard(board);
        });
      }
    });
  });

  // TODO!!! Rank search somewhere else

  describe('Flick hidden/not hidden', () => {
    it ('No Rank', () => {
      doTest(false);
    });
    it ('Rank', () => {
      doTest(true);
    });

    function doTest(rank: boolean) {
      const util: BoardViewObservableUtil = setupTable(rank ? {view: 'rv'} : null);

      util.getUserSettingUpdater().updateSearchIssueIds('ONE-1', 'ONE-2', 'ONE-3');
      check(false, 'ONE-4', 'ONE-5', 'ONE-6');
      util.getUserSettingUpdater().updateSearchHideNonMatching(true);
      check(true, 'ONE-4', 'ONE-5', 'ONE-6');

      util.getUserSettingUpdater().updateSearchContainingText('##1');
      check(true, 'ONE-2', 'ONE-4', 'ONE-5', 'ONE-6');
      util.getUserSettingUpdater().updateSearchHideNonMatching(false);
      check(false, 'ONE-2', 'ONE-4', 'ONE-5', 'ONE-6');

      util.getUserSettingUpdater().updateSearchContainingText('##12');
      check(false, 'ONE-1', 'ONE-2', 'ONE-4', 'ONE-5', 'ONE-6');
      util.getUserSettingUpdater().updateSearchHideNonMatching(true);
      check(true, 'ONE-1', 'ONE-2', 'ONE-4', 'ONE-5', 'ONE-6');

      util.getUserSettingUpdater().updateSearchContainingText('##1');
      check(true, 'ONE-2', 'ONE-4', 'ONE-5', 'ONE-6');
      util.getUserSettingUpdater().updateSearchHideNonMatching(false);
      check(false, 'ONE-2', 'ONE-4', 'ONE-5', 'ONE-6');

      util.getUserSettingUpdater().updateSearchIssueIds('ONE-2');
      check(false, 'ONE-1', 'ONE-2', 'ONE-3', 'ONE-4', 'ONE-5', 'ONE-6');
      util.getUserSettingUpdater().updateSearchHideNonMatching(true);
      check(true, 'ONE-1', 'ONE-2', 'ONE-3', 'ONE-4', 'ONE-5', 'ONE-6');

      util.getUserSettingUpdater().updateSearchContainingText('##');
      check(true, 'ONE-1', 'ONE-3', 'ONE-4', 'ONE-5', 'ONE-6');
      util.getUserSettingUpdater().updateSearchHideNonMatching(false);
      check(false, 'ONE-1', 'ONE-3', 'ONE-4', 'ONE-5', 'ONE-6');

      util.getUserSettingUpdater().updateSearchIssueIds('ONE-1', 'ONE-2', 'ONE-3', 'ONE-4');
      check(false, 'ONE-5', 'ONE-6');
      util.getUserSettingUpdater().updateSearchHideNonMatching(true);
      check(true, 'ONE-5', 'ONE-6');

      util.getUserSettingUpdater().updateSearchIssueQl('priority="Major"');
      check(true, 'ONE-2', 'ONE-4', 'ONE-5', 'ONE-6');
      util.getUserSettingUpdater().updateSearchHideNonMatching(false);
      check(false, 'ONE-2', 'ONE-4', 'ONE-5', 'ONE-6');

      function check(hidden: boolean, ...hiddenIds: string[]) {
        util.easySubscribe(board => {
          const checker: BoardChecker = new BoardChecker(standardTable);
          if (rank) {
            checker.rankOrder(...standardRank);
          }
          if (hidden) {
            checker
              .invisibleIssues(...hiddenIds);
          } else {
            checker.nonMatchingIssues(...hiddenIds);
          }
          checker.checkBoard(board);
        });
      }
    }
  });

  function setupTable(params?: Dictionary<string>): BoardViewObservableUtil {
    const init =
      new BoardStateInitializer()
        .headerStateFactory(new NumberedHeaderStateFactory(3))
        .setRank('ONE', 1, 2, 3, 4, 5, 6)
        .mapState('ONE', 'S-1', '1-1')
        .mapState('ONE', 'S-2', '1-2')
        .mapState('ONE', 'S-3', '1-3')
        .issuesFactory(
          new SimpleIssueFactory()
            // Numbering is <row><column>
            .addIssue('ONE-1', 0, {summary: 'Issue ##11'})
            .addIssue('ONE-2', 0, {summary: 'Issue ##21'})
            .addIssue('ONE-3', 1, {summary: 'Issue ##12'})
            .addIssue('ONE-4', 1, {summary: 'Issue ##22'})
            .addIssue('ONE-5', 2, {summary: 'Issue ##13'})
            .addIssue('ONE-6', 2, {summary: 'Issue ##23'})
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

      it('Switch view', () => {
        util = setupTable(false);
        util.easySubscribe(board => {
          new BoardChecker([[], ['ONE-3', 'ONE-4'], ['ONE-5', 'ONE-6']])
            .checkBoard(board);
          last = board;
        });

        // Go to Rank View
        util.getUserSettingUpdater().switchViewMode()
          .easySubscribe(board => {
            // We need the new deserialized data to actually trigger the new view model when showing/hiding the backlog
            expect(board).toBe(last);
          });
        // The caller (BoardComponent) does a full refresh (since we need the backlog)
        util.updateBoardState(createInitializer(true))
          .easySubscribe(board => {
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
          .easySubscribe(board => {
            // We need the new deserialized data to actually trigger the new view model when showing/hiding the backlog
            expect(board).toBe(last);
          });
        // The caller (BoardComponent) does a full refresh (since we need to unload the backlog)
        util.updateBoardState(createInitializer(false))
          .easySubscribe(board => {
            expect(board).not.toBe(last);
            new BoardChecker([[], ['ONE-3', 'ONE-4'], ['ONE-5', 'ONE-6']])
              .checkBoard(board);
            checkSameColumns(last, board, 1, 2);
            last = board;
          });
      });

      it('Toggle backlog', () => {
        util = setupTable(false);
        util.easySubscribe(board => {
          new BoardChecker([[], ['ONE-3', 'ONE-4'], ['ONE-5', 'ONE-6']])
            .checkBoard(board);
          last = board;
        });

        // Set the backlog to true
        util.getUserSettingUpdater().toggleBacklog()
          .easySubscribe(board => {
            // We need the new deserialized data to actually trigger the new view model
            expect(board).toBe(last);
          });
        // The caller (BoardComponent) does a full refresh (since we need to load the backlog)
        util.updateBoardState(createInitializer(true))
          .easySubscribe(board => {
            expect(board).not.toBe(last);
            new BoardChecker([['ONE-1', 'ONE-2'], ['ONE-3', 'ONE-4'], ['ONE-5', 'ONE-6']])
              .checkBoard(board);
            expect(board).not.toBe(last);
            checkSameColumns(last, board, 1, 2);
            last = board;
          });

        // Set the backlog to false again
        util.getUserSettingUpdater().toggleBacklog()
          .easySubscribe(board => {
            // We need the new deserialized data to actually trigger the new view model
            expect(board.issueTable).toBe(last.issueTable);
          });
        // The caller (BoardComponent) does a full refresh (since we need to unload the backlog)
        util.updateBoardState(createInitializer(false))
          .easySubscribe(board => {
            expect(board).not.toBe(last);
            new BoardChecker([[], ['ONE-3', 'ONE-4'], ['ONE-5', 'ONE-6']])
              .checkBoard(board);
            checkSameColumns(last, board, 1, 2);
            last = board;
          });
      });
    });

    describe('Backlog initially visible', () => {
      it('Switch view', () => {
        // Start off with rank view which forces the backlog
        util = setupTable(true, {bl: 'true'});
        util.easySubscribe(board => {
          new BoardChecker([['ONE-1', 'ONE-2'], ['ONE-3', 'ONE-4'], ['ONE-5', 'ONE-6']])
            .checkBoard(board);
          last = board;
        });

        // Switching to rankview should just use the same issue table since we are not
        // changing the backlog visibility
        util.getUserSettingUpdater().switchViewMode()
          .easySubscribe(board => {
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
          .easySubscribe(board => {
            expect(board).not.toBe(last);
            new BoardChecker([['ONE-1', 'ONE-2'], ['ONE-3', 'ONE-4'], ['ONE-5', 'ONE-6']])
              .checkBoard(board);
            expect(board).not.toBe(last);
            expect(board.issueTable.table).toBe(last.issueTable.table);
            last = board;
          });
      });

      it('Toggle backlog', () => {
        util = setupTable(true, {bl: 'true'});
        util.easySubscribe(board => {
          new BoardChecker([['ONE-1', 'ONE-2'], ['ONE-3', 'ONE-4'], ['ONE-5', 'ONE-6']])
            .checkBoard(board);
          last = board;
        });

        // Set the backlog to false
        util.getUserSettingUpdater().toggleBacklog()
          .easySubscribe(board => {
            // We need the new deserialized data to actually trigger the new view model
            expect(board.issueTable).toBe(last.issueTable);
          });
        // The caller (BoardComponent) does a full refresh (since we need to unload the backlog)
        util.updateBoardState(createInitializer(false))
          .easySubscribe(board => {
            expect(board).not.toBe(last);
            new BoardChecker([[], ['ONE-3', 'ONE-4'], ['ONE-5', 'ONE-6']])
              .checkBoard(board);
            checkSameColumns(last, board, 1, 2);
            last = board;
          });

        // Set the backlog to true
        util.getUserSettingUpdater().toggleBacklog()
          .easySubscribe(board => {
            // We need the new deserialized data to actually trigger the new view model
            expect(board).toBe(last);
          });
        // The caller (BoardComponent) does a full refresh (since we need to load the backlog)
        util.updateBoardState(createInitializer(true))
          .easySubscribe(board => {
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
    util.easySubscribe(board => {
      new BoardChecker([['ONE-1', 'ONE-2'], ['ONE-3', 'ONE-4'], ['ONE-5', 'ONE-6']])
        .rankOrder('ONE-1', 'ONE-2', 'ONE-3', 'ONE-4', 'ONE-5', 'ONE-6')
        .checkBoard(board);
      last = board;
    });

    // Go to Kanban and discard rankview
    util.getUserSettingUpdater().switchViewMode()
      .easySubscribe(board => {
        // We need the new deserialized data to actually trigger the new view model when showing/hiding the backlog
        expect(board).toBe(last);
      });
    // The caller (BoardComponent) does a full refresh (since we need to unload the backlog)
    util.updateBoardState(createInitializer(false))
      .easySubscribe(board => {
        expect(board).not.toBe(last);
        new BoardChecker([[], ['ONE-3', 'ONE-4'], ['ONE-5', 'ONE-6']])
          .checkBoard(board);
        checkSameColumns(last, board, 1, 2);
        last = board;
      });

    util.getUserSettingUpdater().switchViewMode()
      .easySubscribe(board => {
        // We need the new deserialized data to actually trigger the new view model
        expect(board).toBe(last);
      });
    // Push the loaded board state with the backlog data, which is what the component would do when we
    // don't have the backlog data
    util.updateBoardState(createInitializer(true))
      .easySubscribe(board => {
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
      new BoardStateInitializer()
        .headerStateFactory(new BacklogStateFactory(3))
        .mapState('ONE', 'S-1', '1-1')
        .mapState('ONE', 'S-2', '1-2')
        .mapState('ONE', 'S-3', '1-3');
    if (loadBacklog) {
      init.setRank('ONE', 1, 2, 3, 4, 5, 6);
    } else {
      init.setRank('ONE', 3, 4, 5, 6);
    }
    const issueFactory: SimpleIssueFactory = new SimpleIssueFactory();
    if (loadBacklog) {
      issueFactory
        .addIssue('ONE-1', 0)
        .addIssue('ONE-2', 0);
    }
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

describe('Issue Table issue type overrides tests', () => {

  let issueFactory: IssueWithTypeIssueFactory;
  let headerFactory: HeaderStateFactory;
  let init: BoardStateInitializer;
  let util: BoardViewObservableUtil;

  beforeEach(() => {
    issueFactory = new IssueWithTypeIssueFactory();
    headerFactory = new NumberedHeaderStateFactory(5);
    init =
      new BoardStateInitializer()
        .headerStateFactory(headerFactory)
        .mapState('ONE', 'S-1', '1-1')
        .mapState('ONE', 'S-2', '1-2')
        .mapState('ONE', 'S-3', '1-3')
        .mapState('ONE', 'S-5', '1-4')
        .mapIssueTypeState('ONE', 'task', 'S-1', 'T-1')
        .mapIssueTypeState('ONE', 'task', 'S-2', 'T-2')
        .mapIssueTypeState('ONE', 'task', 'S-3', 'T-3')
        .mapIssueTypeState('ONE', 'task', 'S-4', 'T-4')
        .mapIssueTypeState('ONE', 'task', 'S-5', 'T-5')
        .mapIssueTypeState('ONE', 'bug', 'S-1', 'B-1')
        .mapIssueTypeState('ONE', 'bug', 'S-4', 'B-2')
        .setRank('ONE', 101, 102, 103, 104, 201, 202, 203, 204, 205, 301, 302)
        .issuesFactory(
          issueFactory
            .addIssue('ONE-101', 'feature', 0)
            .addIssue('ONE-102', 'feature', 1)
            .addIssue('ONE-103', 'feature', 2)
            .addIssue('ONE-104', 'feature', 3)
            .addIssue('ONE-201', 'task', 0)
            .addIssue('ONE-202', 'task', 1)
            .addIssue('ONE-203', 'task', 2)
            .addIssue('ONE-204', 'task', 3)
            .addIssue('ONE-205', 'task', 4)
            .addIssue('ONE-301', 'bug', 0)
            .addIssue('ONE-302', 'bug', 1)
        );
    util = new BoardViewObservableUtil(null);
    util
      .updateBoardState(init)
      .easySubscribe(board => {
      });
  });

  it('Load table', () => {
    util
      .easySubscribe(board => {
        const checker: BoardChecker = new BoardChecker([
          ['ONE-101', 'ONE-201', 'ONE-301'],
          ['ONE-102', 'ONE-202'],
          ['ONE-103', 'ONE-203'],
          ['ONE-204', 'ONE-302'],
          ['ONE-104', 'ONE-205']]);
        checker.checkBoard(board);
        checkIssueOwnState(board, 'ONE-101', 0, '1-1');
        checkIssueOwnState(board, 'ONE-102', 1, '1-2');
        checkIssueOwnState(board, 'ONE-103', 2, '1-3');
        checkIssueOwnState(board, 'ONE-104', 3, '1-4');
        checkIssueOwnState(board, 'ONE-201', 0, 'T-1');
        checkIssueOwnState(board, 'ONE-202', 1, 'T-2');
        checkIssueOwnState(board, 'ONE-203', 2, 'T-3');
        checkIssueOwnState(board, 'ONE-204', 3, 'T-4');
        checkIssueOwnState(board, 'ONE-205', 4, 'T-5');
        checkIssueOwnState(board, 'ONE-301', 0, 'B-1');
        checkIssueOwnState(board, 'ONE-302', 1, 'B-2');
      });
  });

  it('Create issues', () => {
    util
      .getBoardStateUpdater()
      .issueChanges({
        new: [
          {key: 'ONE-105', state: '1-1', summary: 'Test', priority: 'Major', type: 'feature'},
          {key: 'ONE-106', state: '1-2', summary: 'Test', priority: 'Major', type: 'feature'},
          {key: 'ONE-107', state: '1-3', summary: 'Test', priority: 'Major', type: 'feature'},
          {key: 'ONE-108', state: '1-4', summary: 'Test', priority: 'Major', type: 'feature'},
          {key: 'ONE-206', state: 'T-1', summary: 'Test', priority: 'Major', type: 'task'},
          {key: 'ONE-207', state: 'T-2', summary: 'Test', priority: 'Major', type: 'task'},
          {key: 'ONE-208', state: 'T-3', summary: 'Test', priority: 'Major', type: 'task'},
          {key: 'ONE-209', state: 'T-4', summary: 'Test', priority: 'Major', type: 'task'},
          {key: 'ONE-210', state: 'T-5', summary: 'Test', priority: 'Major', type: 'task'},
          {key: 'ONE-303', state: 'B-1', summary: 'Test', priority: 'Major', type: 'bug'},
          {key: 'ONE-304', state: 'B-2', summary: 'Test', priority: 'Major', type: 'bug'}

          // Add issues for other states
        ]
      })
      .rankChanges({
        ONE: [
          {index: 11, key: 'ONE-105'},
          {index: 12, key: 'ONE-106'},
          {index: 13, key: 'ONE-107'},
          {index: 14, key: 'ONE-108'},
          {index: 15, key: 'ONE-206'},
          {index: 16, key: 'ONE-207'},
          {index: 17, key: 'ONE-208'},
          {index: 18, key: 'ONE-209'},
          {index: 19, key: 'ONE-210'},
          {index: 20, key: 'ONE-303'},
          {index: 21, key: 'ONE-304'},
        ]
      })
      .emit()
      .easySubscribe(
        board => {
          const checker: BoardChecker = new BoardChecker([
            ['ONE-101', 'ONE-201', 'ONE-301', 'ONE-105', 'ONE-206', 'ONE-303'],
            ['ONE-102', 'ONE-202', 'ONE-106', 'ONE-207'],
            ['ONE-103', 'ONE-203', 'ONE-107', 'ONE-208'],
            ['ONE-204', 'ONE-302', 'ONE-209', 'ONE-304'],
            ['ONE-104', 'ONE-205', 'ONE-108', 'ONE-210']]);
          checker.checkBoard(board);
          checkIssueOwnState(board, 'ONE-101', 0, '1-1');
          checkIssueOwnState(board, 'ONE-102', 1, '1-2');
          checkIssueOwnState(board, 'ONE-103', 2, '1-3');
          checkIssueOwnState(board, 'ONE-104', 3, '1-4');
          checkIssueOwnState(board, 'ONE-105', 0, '1-1');
          checkIssueOwnState(board, 'ONE-106', 1, '1-2');
          checkIssueOwnState(board, 'ONE-107', 2, '1-3');
          checkIssueOwnState(board, 'ONE-108', 3, '1-4');
          checkIssueOwnState(board, 'ONE-201', 0, 'T-1');
          checkIssueOwnState(board, 'ONE-202', 1, 'T-2');
          checkIssueOwnState(board, 'ONE-203', 2, 'T-3');
          checkIssueOwnState(board, 'ONE-204', 3, 'T-4');
          checkIssueOwnState(board, 'ONE-205', 4, 'T-5');
          checkIssueOwnState(board, 'ONE-206', 0, 'T-1');
          checkIssueOwnState(board, 'ONE-207', 1, 'T-2');
          checkIssueOwnState(board, 'ONE-208', 2, 'T-3');
          checkIssueOwnState(board, 'ONE-209', 3, 'T-4');
          checkIssueOwnState(board, 'ONE-210', 4, 'T-5');
          checkIssueOwnState(board, 'ONE-301', 0, 'B-1');
          checkIssueOwnState(board, 'ONE-302', 1, 'B-2');
        });
  });

  it('Move issues', () => {
    util
      .getBoardStateUpdater()
      .issueChanges({
        update: [
          {key: 'ONE-101', state: '1-4'},
          {key: 'ONE-102', state: '1-1'},
          {key: 'ONE-103', state: '1-2'},
          {key: 'ONE-104', state: '1-3'},
          {key: 'ONE-201', state: 'T-5'},
          {key: 'ONE-202', state: 'T-1'},
          {key: 'ONE-203', state: 'T-2'},
          {key: 'ONE-204', state: 'T-3'},
          {key: 'ONE-205', state: 'T-4'},
          {key: 'ONE-301', state: 'B-2'},
          {key: 'ONE-302', state: 'B-1'}
        ]
      })
      .emit()
      .easySubscribe(board => {
        const checker: BoardChecker = new BoardChecker([
          ['ONE-102', 'ONE-202', 'ONE-302'],
          ['ONE-103', 'ONE-203'],
          ['ONE-104', 'ONE-204'],
          ['ONE-205', 'ONE-301'],
          ['ONE-101', 'ONE-201']]);
        checker.checkBoard(board);
        checkIssueOwnState(board, 'ONE-101', 3, '1-4');
        checkIssueOwnState(board, 'ONE-102', 0, '1-1');
        checkIssueOwnState(board, 'ONE-103', 1, '1-2');
        checkIssueOwnState(board, 'ONE-104', 2, '1-3');
        checkIssueOwnState(board, 'ONE-201', 4, 'T-5');
        checkIssueOwnState(board, 'ONE-202', 0, 'T-1');
        checkIssueOwnState(board, 'ONE-203', 1, 'T-2');
        checkIssueOwnState(board, 'ONE-204', 2, 'T-3');
        checkIssueOwnState(board, 'ONE-205', 3, 'T-4');
        checkIssueOwnState(board, 'ONE-301', 1, 'B-2');
        checkIssueOwnState(board, 'ONE-302', 0, 'B-1');
      });
  });


  function checkIssueOwnState(board: BoardViewModel, key: string, ownStateIndex: number, ownStateName: string) {
    const issue: BoardIssueView = board.issueTable.issues.get(key);

    expect(issue.ownState).toEqual(ownStateIndex);
    expect(issue.ownStateName).toEqual(ownStateName);
  }
});

function checkSameColumns(oldState: BoardViewModel, newState: BoardViewModel, ...cols: number[]) {
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


class SimpleIssueFactory implements IssuesFactory {
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

class IssueWithTypeIssueFactory implements IssuesFactory {
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

class NumberedHeaderStateFactory implements HeaderStateFactory {
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
  private _nonMatchingIssues: string[] = [];
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


  rankOrder(...rankOrder: string[]): BoardChecker {
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

    if (!this._rankOrder) {
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
