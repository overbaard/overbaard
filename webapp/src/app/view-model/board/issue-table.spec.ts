import {BoardStateInitializer, BoardViewObservableUtil, HeaderStateFactory} from './board-view.common.spec';
import {Dictionary} from '../../common/dictionary';
import {BoardViewModel} from './board-view';
import {BoardIssueView} from './board-issue-view';
import {Epic} from '../../model/board/data/epic/epic.model';
import {
  BoardChecker,
  checkSameColumns,
  IssueWithTypeIssueFactory,
  NumberedHeaderStateFactory,
  NumberedHeaderWithBacklogStateFactory,
  SimpleIssueFactory
} from './issue-table.util.spec';


/**
 * Contains tests for the general issue table. issue table tests involving filters and search
 *  filters should go in issue-table-filters.spec.ts
 */

describe('Issue Table observer tests', () => {
  describe('Create tests', () => {
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

    describe('One project issues', () => {
      describe('All states mapped, issues in all states', () => {
        it('No rank', () => {
          doTest(false);
        });
        it('Rank', () => {
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
              checker.rankOrder(rank, 'ONE-5', 'ONE-1', 'ONE-2', 'ONE-3', 'ONE-4', 'ONE-6');
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
              checker.rankOrder(rank, 'ONE-5', 'ONE-1', 'ONE-2', 'ONE-3', 'ONE-4');
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
              checker.rankOrder(rank, 'ONE-5', 'ONE-1', 'ONE-2', 'ONE-3', 'ONE-4');
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
              checker.rankOrder(rank, 'ONE-4', 'ONE-3', 'ONE-2', 'ONE-1');
              checker.checkBoard(board);
            });
        }
      });
      describe('Epics and Parents', () => {
        it('No rank', () => {
          doTest(false);
        });
        it('Rank', () => {
          doTest(true);
        });

        function doTest(rank: boolean) {
          init
            .setRank('ONE', 5, 1, 2, 3, 4, 6)
            .epics({
              'ONE': [
                {key: 'ONE-900', name: 'Some Epic'},
                {key: 'ONE-901', name: 'Another Epic'}
              ]
            })
            .issuesFactory(
              issueFactory
                .addIssue('ONE-1', 0, {parent: 'ONE-2'})
                .addIssue('ONE-2', 1)
                .addIssue('ONE-3', 2, {epic: 1, parent: 'ONE-4'})
                .addIssue('ONE-4', 3, {epic: 1})
                .addIssue('ONE-5', 2, {epic: 0})
                .addIssue('ONE-6', 2)
            );
          new BoardViewObservableUtil(rank ? {view: 'rv'} : null)
            .updateBoardState(init)
            .easySubscribe((board: BoardViewModel) => {
              const checker: BoardChecker = new BoardChecker([['ONE-1'], ['ONE-2'], ['ONE-5', 'ONE-3', 'ONE-6'], ['ONE-4']]);
              checker.rankOrder(rank, 'ONE-5', 'ONE-1', 'ONE-2', 'ONE-3', 'ONE-4', 'ONE-6');
              checker.checkBoard(board);

              // Do some extra checking here of the issues for epics and parents
              checkEpicAndParent(board.issueTable.issues.get('ONE-1'), null, 'ONE-2');
              checkEpicAndParent(board.issueTable.issues.get('ONE-2'), null, null);
              checkEpicAndParent(board.issueTable.issues.get('ONE-3'), {key: 'ONE-901', name: 'Another Epic'}, 'ONE-4');
              checkEpicAndParent(board.issueTable.issues.get('ONE-4'), {key: 'ONE-901', name: 'Another Epic'}, null);
              checkEpicAndParent(board.issueTable.issues.get('ONE-5'), {key: 'ONE-900', name: 'Some Epic'}, null);
              checkEpicAndParent(board.issueTable.issues.get('ONE-6'), null, null);
            });
        }

        function checkEpicAndParent(issue: BoardIssueView, epic: Epic, parentKey: string) {
          if (epic) {
            expect(issue.epic).toBeTruthy();
            expect(issue.epic.key).toBe(epic.key);
            expect(issue.epic.name).toBe(epic.name);
          } else {
            expect(issue.epic).toBeFalsy();
          }
          if (parentKey) {
            expect(issue.parentKey).toBe(parentKey);
          } else {
            expect(issue.parentKey).toBeFalsy();
          }
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
              checker.rankOrder(rank,
                'ONE-1', 'ONE-2', 'ONE-3', 'ONE-4', 'ONE-5', 'ONE-6', 'TWO-6', 'TWO-5', 'TWO-4', 'TWO-3', 'TWO-2', 'TWO-1');
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
              checker.rankOrder(rank, 'ONE-3', 'ONE-2', 'ONE-1', 'TWO-3', 'TWO-2', 'TWO-1');
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
            checker.rankOrder(rank, 'ONE-1', 'ONE-2', 'ONE-3', 'ONE-4', 'ONE-5', 'ONE-6', 'ONE-7');
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
              checker.rankOrder(rank, 'ONE-1', 'ONE-2', 'ONE-3', 'ONE-4', 'ONE-5', 'ONE-6', 'ONE-7');
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
              checker.rankOrder(rank, 'ONE-1', 'ONE-2', 'ONE-3', 'ONE-4', 'ONE-5', 'ONE-6', 'ONE-7');
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
              checker.rankOrder(rank, 'ONE-1', 'ONE-2', 'ONE-3', 'ONE-4', 'ONE-5', 'ONE-6', 'ONE-7');
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
              checker.rankOrder(rank, 'ONE-1', 'ONE-2', 'ONE-3', 'ONE-4', 'ONE-5', 'ONE-6', 'ONE-7');
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
                checker.rankOrder(rank, 'ONE-1', 'ONE-2', 'ONE-3', 'ONE-4', 'ONE-6', 'ONE-7');
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
                checker.rankOrder(rank, 'ONE-2', 'ONE-3', 'ONE-4', 'ONE-6', 'ONE-7');
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
                  checker.rankOrder(rank, 'ONE-1', 'ONE-2', 'ONE-3', 'ONE-4', 'ONE-5', 'ONE-6', 'ONE-7', 'ONE-8');
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
                  checker.rankOrder(rank, 'ONE-1', 'ONE-2', 'ONE-3', 'ONE-4', 'ONE-5', 'ONE-6', 'ONE-7', 'TWO-1', 'TWO-2');
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
                  checker.rankOrder(rank, 'ONE-1', 'ONE-2', 'ONE-3', 'ONE-4', 'ONE-5', 'ONE-6', 'ONE-7', 'TWO-1', 'TWO-2', 'TWO-3');
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
                    .rankOrder(rank, 'ONE-3', 'ONE-1', 'ONE-2', 'ONE-4', 'ONE-5', 'ONE-6', 'ONE-7')
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
                checker.rankOrder(rank, 'ONE-1', 'ONE-2', 'ONE-4', 'ONE-5', 'ONE-6', 'ONE-7', 'ONE-3');
                checker.checkBoard(board);
                checkSameColumns(original, board, 0, 1, 3);
              });
        }
      });
    });
  });

  describe('Switch View Mode (effect on Backlog) Tests', () => {

    let standardRanks: string[];
    beforeEach(() => {
      standardRanks = ['ONE-1', 'ONE-2', 'ONE-3', 'ONE-4', 'ONE-5', 'ONE-6'];
    });

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
              .rankOrder(false, ...standardRanks)
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
                .rankOrder(true, ...standardRanks)
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
                .rankOrder(false, ...standardRanks)
                .checkBoard(board);
              checkSameColumns(last, board, 1, 2);
              last = board;
            });
        });

        it('Toggle backlog', () => {
          util = setupTable(false);
          util.easySubscribe(board => {
            new BoardChecker([[], ['ONE-3', 'ONE-4'], ['ONE-5', 'ONE-6']])
              .rankOrder(false, ...standardRanks)
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
                .rankOrder(false, ...standardRanks)
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
                .rankOrder(false, ...standardRanks)
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
              .rankOrder(false, ...standardRanks)
              .checkBoard(board);
            last = board;
          });

          // Switching to rankview should just use the same issue table since we are not
          // changing the backlog visibility
          util.getUserSettingUpdater().switchViewMode()
            .easySubscribe(board => {
              expect(board).not.toBe(last);
              new BoardChecker([['ONE-1', 'ONE-2'], ['ONE-3', 'ONE-4'], ['ONE-5', 'ONE-6']])
                .rankOrder(true, ...standardRanks)
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
                .rankOrder(false, ...standardRanks)
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
              .rankOrder(false, ...standardRanks)
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
                .rankOrder(false, ...standardRanks)
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
                .rankOrder(false, ...standardRanks)
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
          .rankOrder(true, ...standardRanks)
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
            .rankOrder(false, ...standardRanks)
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
            .rankOrder(true, ...standardRanks)
            .checkBoard(board);
          checkSameColumns(last, board, 1, 2);
          last = board;
        });

    });

    function createInitializer(loadBacklog: boolean): BoardStateInitializer {
      const init =
        new BoardStateInitializer()
          .headerStateFactory(new NumberedHeaderWithBacklogStateFactory(3))
          .mapState('ONE', 'S-1', '1-1')
          .mapState('ONE', 'S-2', '1-2')
          .mapState('ONE', 'S-3', '1-3');
      init.setRank('ONE', 1, 2, 3, 4, 5, 6);
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
          checker.rankOrder(false,
            'ONE-101', 'ONE-102', 'ONE-103', 'ONE-104', 'ONE-201', 'ONE-202', 'ONE-203', 'ONE-204', 'ONE-205', 'ONE-301', 'ONE-302');
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
            checker.rankOrder(false,
              'ONE-101', 'ONE-102', 'ONE-103', 'ONE-104', 'ONE-105', 'ONE-106', 'ONE-107', 'ONE-108',
              'ONE-201', 'ONE-202', 'ONE-203', 'ONE-204', 'ONE-205', 'ONE-206', 'ONE-207', 'ONE-208', 'ONE-209', 'ONE-210',
              'ONE-301', 'ONE-302', 'ONE-303', 'ONE-304');

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
          checker.rankOrder(false,
            'ONE-101', 'ONE-102', 'ONE-103', 'ONE-104', 'ONE-201', 'ONE-202', 'ONE-203', 'ONE-204', 'ONE-205', 'ONE-301', 'ONE-302');
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
});
