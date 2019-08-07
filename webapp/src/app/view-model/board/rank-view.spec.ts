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
import {RankViewEntry} from './rank-view-entry';
import {List} from 'immutable';


/**
 * Contains tests specifically for the rank view.
 *
 * For example in the rank view, when collapsing a state column, the issues in that state are removed from the ranked issues list
 */

describe('Rank View observer tests', () => {
  describe('State visibility', () => {
    let issueFactory: SimpleIssueFactory;
    let headerFactory: HeaderStateFactory;
    let init: BoardStateInitializer;

    // Test:
    // Combining with search filter

    beforeEach(() => {
      issueFactory = new SimpleIssueFactory();
      headerFactory = new NumberedHeaderStateFactory(4);
      init = createInitializer(issueFactory, headerFactory);

    });

    describe('Load rank view', () => {
      it('Initially all visible', () => {
        new BoardViewObservableUtil({view: 'rv'})
          .updateBoardState(init)
          .easySubscribe(board => {
            checkRankEntries(board, 5, 1, 2, 3, 4, 6);
          });
      });

      it('Initially all hidden', () => {
        new BoardViewObservableUtil({view: 'rv', hidden: '0,1,2,3'})
          .updateBoardState(init)
          .easySubscribe(board => {
            checkRankEntries(board);
          });
      });

      it('Initially some hidden', () => {
        new BoardViewObservableUtil({view: 'rv', hidden: '2'})
          .updateBoardState(init)
          .easySubscribe(board => {
            checkRankEntries(board, 1, 2, 4);
          });
      });

      it ('Toggle visibility', () => {
        const util: BoardViewObservableUtil = new BoardViewObservableUtil({view: 'rv'});
        util
          .updateBoardState(init)
          .easySubscribe(board => {
            checkRankEntries(board, 5, 1, 2, 3, 4, 6);
          });
        util.getUserSettingUpdater()
          .toggleStateVisibility(false, 0)
          .easySubscribe(board => {
            checkRankEntries(board, 5, 2, 3, 4, 6);
          });
        util.getUserSettingUpdater()
          .toggleStateVisibility(false, 1, 2)
          .easySubscribe(board => {
            checkRankEntries(board, 4);
          });
        util.getUserSettingUpdater()
          .toggleStateVisibility(false, 3)
          .easySubscribe(board => {
            checkRankEntries(board);
          });
        util.getUserSettingUpdater()
          .toggleStateVisibility(true, 2)
          .easySubscribe(board => {
            checkRankEntries(board, 5, 3, 6);
          });
        util.getUserSettingUpdater()
          .toggleStateVisibility(true, 0, 1)
          .easySubscribe(board => {
            checkRankEntries(board, 5, 1, 2, 3, 6);
          });
        util.getUserSettingUpdater()
          .toggleStateVisibility(true, 3)
          .easySubscribe(board => {
            checkRankEntries(board, 5, 1, 2, 3, 4, 6);
          });
      });
    });

    describe('Toggle view', () => {
      it('All visible', () => {
        const util: BoardViewObservableUtil = new BoardViewObservableUtil();
        let last: BoardViewModel;
        util
          .updateBoardState(init)
          .easySubscribe((board: BoardViewModel) => {
            checkRankEntries(board);
            last = board;
          });

        util.getUserSettingUpdater().switchViewMode()
          .easySubscribe(board => {
            // We need the new deserialized data to actually trigger the new view model when showing/hiding the backlog
            expect(board).toBe(last);
          });
        util.updateBoardState(createInitializer(issueFactory, headerFactory))
          .easySubscribe(board => {
            checkRankEntries(board, 5, 1, 2, 3, 4, 6);
            last = board;
          });

        util.getUserSettingUpdater().switchViewMode()
          .easySubscribe(board => {
            // We need the new deserialized data to actually trigger the new view model when showing/hiding the backlog
            expect(board).toBe(last);
          });
        util.updateBoardState(createInitializer(issueFactory, headerFactory))
          .easySubscribe(board => {
            checkRankEntries(board);
            last = board;
          });

        util.getUserSettingUpdater().switchViewMode()
          .easySubscribe(board => {
            // We need the new deserialized data to actually trigger the new view model when showing/hiding the backlog
            expect(board).toBe(last);
          });
        util.updateBoardState(createInitializer(issueFactory, headerFactory))
          .easySubscribe(board => {
            checkRankEntries(board, 5, 1, 2, 3, 4, 6);
            last = board;
          });
      });

      it ('All Hidden', () => {
        const util: BoardViewObservableUtil = new BoardViewObservableUtil({hidden: '0,1,2,3'});
        let last: BoardViewModel;
        util
          .updateBoardState(init)
          .easySubscribe(board => {
            checkRankEntries(board);
            last = board;
          });

        util.getUserSettingUpdater().switchViewMode()
          .easySubscribe(board => {
            // We need the new deserialized data to actually trigger the new view model when showing/hiding the backlog
            expect(board).toBe(last);
          });
        util.updateBoardState(createInitializer(issueFactory, headerFactory))
          .easySubscribe(board => {
            checkRankEntries(board);
            last = board;
          });

        util.getUserSettingUpdater().switchViewMode()
          .easySubscribe(board => {
            // We need the new deserialized data to actually trigger the new view model when showing/hiding the backlog
            expect(board).toBe(last);
          });
        util.updateBoardState(createInitializer(issueFactory, headerFactory))
          .easySubscribe(board => {
            checkRankEntries(board);
            last = board;
          });

        util.getUserSettingUpdater().switchViewMode()
          .easySubscribe(board => {
            // We need the new deserialized data to actually trigger the new view model when showing/hiding the backlog
            expect(board).toBe(last);
          });
        util.updateBoardState(createInitializer(issueFactory, headerFactory))
          .easySubscribe(board => {
            checkRankEntries(board);
            last = board;
          });
      });

      it ('Some Hidden', () => {
        const util: BoardViewObservableUtil = new BoardViewObservableUtil({hidden: '2,3'});
        let last: BoardViewModel;
        util
          .updateBoardState(init)
          .easySubscribe(board => {
            checkRankEntries(board);
            last = board;
          });

        util.getUserSettingUpdater().switchViewMode()
          .easySubscribe(board => {
            // We need the new deserialized data to actually trigger the new view model when showing/hiding the backlog
            expect(board).toBe(last);
          });
        util.updateBoardState(createInitializer(issueFactory, headerFactory))
          .easySubscribe(board => {
            checkRankEntries(board, 1, 2);
            last = board;
          });

        util.getUserSettingUpdater().switchViewMode()
          .easySubscribe(board => {
            // We need the new deserialized data to actually trigger the new view model when showing/hiding the backlog
            expect(board).toBe(last);
          });
        util.updateBoardState(createInitializer(issueFactory, headerFactory))
          .easySubscribe(board => {
            expect(board.issueTable.rankView.size).toBe(0);
            last = board;
          });

        util.getUserSettingUpdater().switchViewMode()
          .easySubscribe(board => {
            // We need the new deserialized data to actually trigger the new view model when showing/hiding the backlog
            expect(board).toBe(last);
          });
        util.updateBoardState(createInitializer(issueFactory, headerFactory))
          .easySubscribe(board => {
            checkRankEntries(board, 1, 2);
            last = board;
          });
      });

      it ('Toggle between switching', () => {
        const util: BoardViewObservableUtil = new BoardViewObservableUtil({hidden: '2,3'});
        let last: BoardViewModel;
        util
          .updateBoardState(init)
          .easySubscribe(board => {
            checkRankEntries(board);
          });
        util.getUserSettingUpdater()
          .toggleStateVisibility(true, 3)
          .easySubscribe(board => {
            checkRankEntries(board);
            last = board;
          });

        util.getUserSettingUpdater().switchViewMode()
          .easySubscribe(board => {
            // We need the new deserialized data to actually trigger the new view model when showing/hiding the backlog
            expect(board).toBe(last);
          });
        util.updateBoardState(createInitializer(issueFactory, headerFactory))
          .easySubscribe(board => {
            checkRankEntries(board, 1, 2, 4);
            last = board;
          });
        util.getUserSettingUpdater()
          .toggleStateVisibility(false, 1)
          .easySubscribe(board => {
            checkRankEntries(board, 1, 4);
            last = board;
          });

        util.getUserSettingUpdater().switchViewMode()
          .easySubscribe(board => {
            // We need the new deserialized data to actually trigger the new view model when showing/hiding the backlog
            expect(board).toBe(last);
          });
        util.updateBoardState(createInitializer(issueFactory, headerFactory))
          .easySubscribe(board => {
            checkRankEntries(board);
            last = board;
          });
        util.getUserSettingUpdater()
          .toggleStateVisibility(false, 0, 3)
          .easySubscribe(board => {
            checkRankEntries(board);
            last = board;
          });
        util.getUserSettingUpdater()
          .toggleStateVisibility(true, 2)
          .easySubscribe(board => {
            checkRankEntries(board);
            last = board;
          });

        util.getUserSettingUpdater().switchViewMode()
          .easySubscribe(board => {
            // We need the new deserialized data to actually trigger the new view model when showing/hiding the backlog
            expect(board).toBe(last);
          });
        util.updateBoardState(createInitializer(issueFactory, headerFactory))
          .easySubscribe(board => {
            checkRankEntries(board, 5, 3, 6);
            last = board;
          });
      });
    });

    it('Combine with filters', () => {
      const util: BoardViewObservableUtil = new BoardViewObservableUtil({view: 'rv', 'issue-type': 'bug', hidden: '0'});
      let last: BoardViewModel;
      util
        .updateBoardState(init)
        .easySubscribe(board => {
          checkRankEntries(board, 5, 3);
        });
      util.getUserSettingUpdater()
        .toggleStateVisibility(true, 0)
        .easySubscribe(board => {
          checkRankEntries(board, 5, 1, 3);
        });
      util.getUserSettingUpdater()
        .toggleStateVisibility(false, 2)
        .easySubscribe(board => {
          checkRankEntries(board, 1);
        });
      util.getUserSettingUpdater()
        .updateFilters('issue-type', 'task')
        .easySubscribe(board => {
          checkRankEntries(board, 2, 4);
          last = board;
        });

      util.getUserSettingUpdater().switchViewMode()
        .easySubscribe(board => {
          // We need the new deserialized data to actually trigger the new view model when showing/hiding the backlog
          expect(board).toBe(last);
        });
      util.updateBoardState(createInitializer(issueFactory, headerFactory))
        .easySubscribe(board => {
          checkRankEntries(board);
          last = board;
        });

      util.getUserSettingUpdater().switchViewMode()
        .easySubscribe(board => {
          // We need the new deserialized data to actually trigger the new view model when showing/hiding the backlog
          expect(board).toBe(last);
        });
      util.updateBoardState(createInitializer(issueFactory, headerFactory))
        .easySubscribe(board => {
          checkRankEntries(board, 2, 4);
          last = board;
        });


      util.getUserSettingUpdater().switchViewMode()
        .easySubscribe(board => {
          // We need the new deserialized data to actually trigger the new view model when showing/hiding the backlog
          expect(board).toBe(last);
        });
      util.updateBoardState(createInitializer(issueFactory, headerFactory))
        .easySubscribe(board => {
          checkRankEntries(board);
          last = board;
        });

      // Change some things in the Kanban view
      util.getUserSettingUpdater()
        .updateFilters('issue-type', 'bug')
        .easySubscribe(board => {
        });
      util.getUserSettingUpdater()
        .toggleStateVisibility(true, 2)
        .easySubscribe(board => {
        });
      util.getUserSettingUpdater()
        .toggleStateVisibility(false, 0, 1)
        .easySubscribe(board => {
          last = board;
        });

      util.getUserSettingUpdater().switchViewMode()
        .easySubscribe(board => {
          // We need the new deserialized data to actually trigger the new view model when showing/hiding the backlog
          expect(board).toBe(last);
        });
      util.updateBoardState(createInitializer(issueFactory, headerFactory))
        .easySubscribe(board => {
          checkRankEntries(board, 5, 3);
          last = board;
        });
    });

    describe('Combine with search', () => {
      it ('Show non-matching', () => {
        const util: BoardViewObservableUtil =
          new BoardViewObservableUtil({view: 'rv', 's.ids': 'ONE-1,ONE-3,ONE-5', hidden: '0'});
        let last: BoardViewModel;
        util
          .updateBoardState(init)
          .easySubscribe(board => {
            checkRankEntries(board, 5, 2, 3, 4, 6);
            checkMatchSearch(board, 5, 3);
          });
      util.getUserSettingUpdater()
        .toggleStateVisibility(true, 0)
        .easySubscribe(board => {
          checkRankEntries(board, 5, 1, 2, 3, 4, 6);
          checkMatchSearch(board, 5, 1, 3);
        });
      util.getUserSettingUpdater()
        .toggleStateVisibility(false, 2)
        .easySubscribe(board => {
          checkRankEntries(board, 1, 2, 4);
          checkMatchSearch(board, 1);
        });
      util.getUserSettingUpdater()
        .updateSearchIssueIds('ONE-2', 'ONE-4', 'ONE-6')
        .easySubscribe(board => {
          checkRankEntries(board, 1, 2, 4);
          checkMatchSearch(board, 2, 4);
          last = board;
        });

      util.getUserSettingUpdater().switchViewMode()
        .easySubscribe(board => {
          // We need the new deserialized data to actually trigger the new view model when showing/hiding the backlog
          expect(board).toBe(last);
        });
      util.updateBoardState(createInitializer(issueFactory, headerFactory))
        .easySubscribe(board => {
          checkRankEntries(board);
          last = board;
        });

      util.getUserSettingUpdater().switchViewMode()
        .easySubscribe(board => {
          // We need the new deserialized data to actually trigger the new view model when showing/hiding the backlog
          expect(board).toBe(last);
        });
      util.updateBoardState(createInitializer(issueFactory, headerFactory))
        .easySubscribe(board => {
          checkRankEntries(board, 1, 2, 4);
          checkMatchSearch(board, 2, 4);
          last = board;
        });

      util.getUserSettingUpdater().switchViewMode()
        .easySubscribe(board => {
          // We need the new deserialized data to actually trigger the new view model when showing/hiding the backlog
          expect(board).toBe(last);
        });
      util.updateBoardState(createInitializer(issueFactory, headerFactory))
        .easySubscribe(board => {
          checkRankEntries(board);
          last = board;
        });

      // Change some things in the Kanban view
      util.getUserSettingUpdater()
        .updateSearchIssueIds('ONE-1', 'ONE-3', 'ONE-5')
        .easySubscribe(board => {
        });
      util.getUserSettingUpdater()
        .toggleStateVisibility(true, 2)
        .easySubscribe(board => {
        });
      util.getUserSettingUpdater()
        .toggleStateVisibility(false, 0, 1)
        .easySubscribe(board => {
          last = board;
        });

      util.getUserSettingUpdater().switchViewMode()
        .easySubscribe(board => {
          // We need the new deserialized data to actually trigger the new view model when showing/hiding the backlog
          expect(board).toBe(last);
        });
      util.updateBoardState(createInitializer(issueFactory, headerFactory))
        .easySubscribe(board => {
          checkRankEntries(board, 5, 3, 4, 6);
          checkMatchSearch(board, 5, 3);
          last = board;
        });
      });

      it ('Hide non-matching', () => {
        const util: BoardViewObservableUtil =
          new BoardViewObservableUtil({view: 'rv', 's.ids': 'ONE-1,ONE-3,ONE-5', hidden: '0', 's.hide': 'true'});
        let last: BoardViewModel;
        util
          .updateBoardState(init)
          .easySubscribe(board => {
            checkRankEntries(board, 5, 3);
            checkMatchSearch(board, 5, 3);
          });
        util.getUserSettingUpdater()
          .toggleStateVisibility(true, 0)
          .easySubscribe(board => {
            checkRankEntries(board, 5, 1, 3);
            checkMatchSearch(board, 5, 1, 3);
          });
        util.getUserSettingUpdater()
          .toggleStateVisibility(false, 2)
          .easySubscribe(board => {
            checkRankEntries(board, 1);
            checkMatchSearch(board, 1);
          });
        util.getUserSettingUpdater()
          .updateSearchIssueIds('ONE-2', 'ONE-4', 'ONE-6')
          .easySubscribe(board => {
            checkRankEntries(board, 2, 4);
            checkMatchSearch(board, 2, 4);
            last = board;
          });

        util.getUserSettingUpdater().switchViewMode()
          .easySubscribe(board => {
            // We need the new deserialized data to actually trigger the new view model when showing/hiding the backlog
            expect(board).toBe(last);
          });
        util.updateBoardState(createInitializer(issueFactory, headerFactory))
          .easySubscribe(board => {
            checkRankEntries(board);
            last = board;
          });

        util.getUserSettingUpdater().switchViewMode()
          .easySubscribe(board => {
            // We need the new deserialized data to actually trigger the new view model when showing/hiding the backlog
            expect(board).toBe(last);
          });
        util.updateBoardState(createInitializer(issueFactory, headerFactory))
          .easySubscribe(board => {
            checkRankEntries(board, 2, 4);
            checkMatchSearch(board, 2, 4);
            last = board;
          });

        util.getUserSettingUpdater().switchViewMode()
          .easySubscribe(board => {
            // We need the new deserialized data to actually trigger the new view model when showing/hiding the backlog
            expect(board).toBe(last);
          });
        util.updateBoardState(createInitializer(issueFactory, headerFactory))
          .easySubscribe(board => {
            checkRankEntries(board);
            last = board;
          });

        // Change some things in the Kanban view
        util.getUserSettingUpdater()
          .updateSearchIssueIds('ONE-1', 'ONE-3', 'ONE-5')
          .easySubscribe(board => {
          });
        util.getUserSettingUpdater()
          .toggleStateVisibility(true, 2)
          .easySubscribe(board => {
          });
        util.getUserSettingUpdater()
          .toggleStateVisibility(false, 0, 1)
          .easySubscribe(board => {
            last = board;
          });

        util.getUserSettingUpdater().switchViewMode()
          .easySubscribe(board => {
            // We need the new deserialized data to actually trigger the new view model when showing/hiding the backlog
            expect(board).toBe(last);
          });
        util.updateBoardState(createInitializer(issueFactory, headerFactory))
          .easySubscribe(board => {
            checkRankEntries(board, 5, 3);
            checkMatchSearch(board, 5, 3);
            last = board;
          });
      });

      it ('Toggle non-matching', () => {
        const util: BoardViewObservableUtil =
          new BoardViewObservableUtil({view: 'rv', 's.ids': 'ONE-1,ONE-3,ONE-5', hidden: '0', 's.hide': 'true'});
        let last: BoardViewModel;
        util
          .updateBoardState(init)
          .easySubscribe(board => {
            checkRankEntries(board, 5, 3);
            checkMatchSearch(board, 5, 3);
          });
        util
          .getUserSettingUpdater()
          .updateSearchHideNonMatching(false)
          .easySubscribe(board => {
            checkRankEntries(board, 5, 2, 3, 4, 6);
            checkMatchSearch(board, 5, 3);
          });

        util.getUserSettingUpdater()
          .toggleStateVisibility(true, 0)
          .easySubscribe(board => {
            checkRankEntries(board, 5, 1, 2, 3, 4, 6);
            checkMatchSearch(board, 5, 1, 3);
          });

        util
          .getUserSettingUpdater()
          .updateSearchHideNonMatching(true)
          .easySubscribe(board => {
            checkRankEntries(board, 5, 1, 3);
            checkMatchSearch(board, 5, 1, 3);
          });

        util.getUserSettingUpdater()
          .toggleStateVisibility(false, 2)
          .easySubscribe(board => {
            checkRankEntries(board, 1);
            checkMatchSearch(board, 1);
          });
      });
    });
  });

  // Doing a more lightweight test here than in e.g. issue-table.spec.ts to just focus on the important stuff
  // (and being a bit lazy :) )
  function checkRankEntries(board: BoardViewModel, ...expected: number[]) {
    const list: string[] = board.issueTable.rankView.toArray().map(r => r.issue.key);
    const expectedKeys: string[] = expected.map(n => 'ONE-' + n);
    expect(list).toEqual(expectedKeys);
  }

  // Only important when we do tests tweaking the issue search
  function checkMatchSearch(board: BoardViewModel, ...expectedMatching: number[]) {
    const list: string[] = board.issueTable.rankView.toArray().filter(r => r.issue.matchesSearch).map(r => r.issue.key);
    const expectedKeys: string[] = expectedMatching.map(n => 'ONE-' + n);
    expect(list).toEqual(expectedKeys);
  }


  function createInitializer(issueFactory: SimpleIssueFactory, headerFactory: HeaderStateFactory): BoardStateInitializer {

    return new BoardStateInitializer()
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
          .addIssue('ONE-6', 2)
      );
  }
});
