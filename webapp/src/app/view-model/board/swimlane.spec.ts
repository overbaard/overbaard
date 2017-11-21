import {
  BoardStateInitializer, BoardViewObservableUtil, HeaderStateFactory,
  IssuesFactory
} from './board-view.common.spec';
import {Dictionary} from '../../common/dictionary';
import {DeserializeIssueLookupParams} from '../../model/board/data/issue/issue.model';
import {HeaderState} from '../../model/board/data/header/header.state';
import {HeaderActions, headerMetaReducer} from '../../model/board/data/header/header.reducer';
import {initialHeaderState} from '../../model/board/data/header/header.model';
import {SwimlaneInfo} from './swimlane-info';
import {List, Map, Set} from 'immutable';
import {NONE_FILTER} from '../../model/board/user/board-filter/board-filter.constants';
import {BoardViewModel} from './board-view';
import {SwimlaneData} from './swimlane-data';
import {BoardHeader} from './board-header';
import {IssueTable} from './issue-table';

describe('Swimlane observer tests', () => {

  describe('No Filters', () => {
    describe('Create swimlane', () => {
      it('Project', () => {
        // Project is a bit different from the others in this test
        createUtil(
          {swimlane: 'project'},
          {'ONE': [4, 3, 2, 1], 'TWO': [3, 2, 1]},
          new SwimlaneIssueFactory()
            .addIssue('ONE-1', 0)
            .addIssue('ONE-2', 0)
            .addIssue('ONE-3', 1)
            .addIssue('ONE-4', 2)
            .addIssue('TWO-1', 0)
            .addIssue('TWO-2', 1)
            .addIssue('TWO-3', 1))
          .observer().take(1).subscribe(
          board => {
            new BoardChecker([['ONE-2', 'ONE-1'], ['ONE-3', 'TWO-1'], ['ONE-4', 'TWO-3', 'TWO-2']])
              .swimlanes([
                {key: 'ONE', name: 'ONE', issues: ['ONE-1', 'ONE-2', 'ONE-3', 'ONE-4']},
                {key: 'TWO', name: 'TWO', issues: ['TWO-1', 'TWO-2', 'TWO-3']}])
              .checkBoard(board);
          });
      });
      it('Issue Type', () => {
        createUtilWithStandardIssues({swimlane: 'issue-type'})
          .observer().take(1).subscribe(
          board => {
            new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3'], ['ONE-4', 'ONE-5'], []])
              .swimlanes([
                {key: 'task', name: 'task', issues: ['ONE-2', 'ONE-4']},
                {key: 'bug', name: 'bug', issues: ['ONE-1', 'ONE-3', 'ONE-5']}])
              .checkBoard(board);
          });
      });
      it('Priority', () => {
        createUtilWithStandardIssues({swimlane: 'priority'})
          .observer().take(1).subscribe(
          board => {
            new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3'], ['ONE-4', 'ONE-5'], []])
              .swimlanes([
                {key: 'Blocker', name: 'Blocker', issues: ['ONE-1', 'ONE-3', 'ONE-5']},
                {key: 'Major', name: 'Major', issues: ['ONE-2', 'ONE-4']}])
              .checkBoard(board);
          });
      });
      it('Assignee', () => {
        createUtilWithStandardIssues({swimlane: 'assignee'})
          .observer().take(1).subscribe(
          board => {
            new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3'], ['ONE-4', 'ONE-5'], []])
              .swimlanes([
                {key: 'bob', name: 'Bob Brent Barlow', issues: ['ONE-3']},
                {key: 'kabir', name: 'Kabir Khan', issues: ['ONE-1', 'ONE-4']},
                {key: NONE_FILTER, name: 'None', issues: ['ONE-2', 'ONE-5']}])
              .checkBoard(board);
          });
      });
      it('Components', () => {
        createUtilWithStandardIssues({swimlane: 'component'})
          .observer().take(1).subscribe(
          board => {
            new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3'], ['ONE-4', 'ONE-5'], []])
              .swimlanes([
                {key: 'C-10', name: 'C-10', issues: ['ONE-1', 'ONE-4']},
                {key: 'C-20', name: 'C-20', issues: ['ONE-2', 'ONE-4']},
                {key: 'C-30', name: 'C-30', issues: ['ONE-3', 'ONE-4']},
                {key: NONE_FILTER, name: 'None', issues: ['ONE-5']}])
              .checkBoard(board);
          });
      });
      it('Fix Versions', () => {
        createUtilWithStandardIssues({swimlane: 'fix-version'})
          .observer().take(1).subscribe(
          board => {
            new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3'], ['ONE-4', 'ONE-5'], []])
              .swimlanes([
                {key: 'F-10', name: 'F-10', issues: ['ONE-1', 'ONE-2']},
                {key: 'F-20', name: 'F-20', issues: ['ONE-1', 'ONE-3']},
                {key: 'F-30', name: 'F-30', issues: ['ONE-1', 'ONE-5']},
                {key: NONE_FILTER, name: 'None', issues: ['ONE-4']}])
              .checkBoard(board);
          });
      });
      it('Labels', () => {
        createUtilWithStandardIssues({swimlane: 'label'})
          .observer().take(1).subscribe(
          board => {
            new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3'], ['ONE-4', 'ONE-5'], []])
              .swimlanes([
                {key: 'L-10', name: 'L-10', issues: ['ONE-2', 'ONE-3']},
                {key: 'L-20', name: 'L-20', issues: ['ONE-2', 'ONE-4']},
                {key: 'L-30', name: 'L-30', issues: ['ONE-2', 'ONE-5']},
                {key: NONE_FILTER, name: 'None', issues: ['ONE-1']}])
              .checkBoard(board);
          });
      });
      it('Custom Field', () => {
        createUtilWithStandardIssues({swimlane: 'Custom-2'})
          .observer().take(1).subscribe(
          board => {
            new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3'], ['ONE-4', 'ONE-5'], []])
              .swimlanes([
                {key: 'c2-A', name: 'First C2', issues: ['ONE-1', 'ONE-2', 'ONE-3']},
                {key: 'c2-B', name: 'Second C2', issues: ['ONE-4']},
                {key: NONE_FILTER, name: 'None', issues: ['ONE-5']}])
              .checkBoard(board);
          });
      });
    });

    describe('Switch to swimlane', () => {
      it('Project', () => {
        // Project is a bit different from the others in this test
        const util: BoardViewObservableUtil = createUtil(
          {},
          {'ONE': [4, 3, 2, 1], 'TWO': [3, 2, 1]},
          new SwimlaneIssueFactory()
            .addIssue('ONE-1', 0)
            .addIssue('ONE-2', 0)
            .addIssue('ONE-3', 1)
            .addIssue('ONE-4', 2)
            .addIssue('TWO-1', 0)
            .addIssue('TWO-2', 1)
            .addIssue('TWO-3', 1));
        util.observer().take(1).subscribe(
          board => {
            new BoardChecker([['ONE-2', 'ONE-1'], ['ONE-3', 'TWO-1'], ['ONE-4', 'TWO-3', 'TWO-2']])
              .checkBoard(board);
          });
        util.getUserSettingUpdater()
          .updateSwimlane('project')
          .observer().take(1).subscribe(
          board => {
            new BoardChecker([['ONE-2', 'ONE-1'], ['ONE-3', 'TWO-1'], ['ONE-4', 'TWO-3', 'TWO-2']])
              .swimlanes([
                {key: 'ONE', name: 'ONE', issues: ['ONE-1', 'ONE-2', 'ONE-3', 'ONE-4']},
                {key: 'TWO', name: 'TWO', issues: ['TWO-1', 'TWO-2', 'TWO-3']}])
              .checkBoard(board);
          });
        // Check resetting the swimlanes, it does not need testing elsewhere
        util.getUserSettingUpdater()
          .updateSwimlane(null)
          .observer().take(1).subscribe(
          board => {
            new BoardChecker([['ONE-2', 'ONE-1'], ['ONE-3', 'TWO-1'], ['ONE-4', 'TWO-3', 'TWO-2']])
              .checkBoard(board);
          });
      });

      it('Other', () => {
        // Test switching between all these in one go, just to see there isn't anything hanging around
        const util: BoardViewObservableUtil = createUtilWithStandardIssues({});
        util.observer().take(1).subscribe(
          board => {
            new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3'], ['ONE-4', 'ONE-5'], []])
              .checkBoard(board);
          });

        util.getUserSettingUpdater()
          .updateSwimlane('issue-type')
          .observer().take(1).subscribe(
          board => {
            new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3'], ['ONE-4', 'ONE-5'], []])
              .swimlanes([
                {key: 'task', name: 'task', issues: ['ONE-2', 'ONE-4']},
                {key: 'bug', name: 'bug', issues: ['ONE-1', 'ONE-3', 'ONE-5']}])
              .checkBoard(board);
          });

        util.getUserSettingUpdater()
          .updateSwimlane('priority')
          .observer().take(1).subscribe(
          board => {
            new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3'], ['ONE-4', 'ONE-5'], []])
              .swimlanes([
                {key: 'Blocker', name: 'Blocker', issues: ['ONE-1', 'ONE-3', 'ONE-5']},
                {key: 'Major', name: 'Major', issues: ['ONE-2', 'ONE-4']}])
              .checkBoard(board);
          });

        util.getUserSettingUpdater()
          .updateSwimlane('assignee')
          .observer().take(1).subscribe(
          board => {
            new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3'], ['ONE-4', 'ONE-5'], []])
              .swimlanes([
                {key: 'bob', name: 'Bob Brent Barlow', issues: ['ONE-3']},
                {key: 'kabir', name: 'Kabir Khan', issues: ['ONE-1', 'ONE-4']},
                {key: NONE_FILTER, name: 'None', issues: ['ONE-2', 'ONE-5']}])
              .checkBoard(board);
          });

        util.getUserSettingUpdater()
          .updateSwimlane('component')
          .observer().take(1).subscribe(
          board => {
            new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3'], ['ONE-4', 'ONE-5'], []])
              .swimlanes([
                {key: 'C-10', name: 'C-10', issues: ['ONE-1', 'ONE-4']},
                {key: 'C-20', name: 'C-20', issues: ['ONE-2', 'ONE-4']},
                {key: 'C-30', name: 'C-30', issues: ['ONE-3', 'ONE-4']},
                {key: NONE_FILTER, name: 'None', issues: ['ONE-5']}])
              .checkBoard(board);
          });

        util.getUserSettingUpdater()
          .updateSwimlane('fix-version')
          .observer().take(1).subscribe(
          board => {
            new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3'], ['ONE-4', 'ONE-5'], []])
              .swimlanes([
                {key: 'F-10', name: 'F-10', issues: ['ONE-1', 'ONE-2']},
                {key: 'F-20', name: 'F-20', issues: ['ONE-1', 'ONE-3']},
                {key: 'F-30', name: 'F-30', issues: ['ONE-1', 'ONE-5']},
                {key: NONE_FILTER, name: 'None', issues: ['ONE-4']}])
              .checkBoard(board);
          });

        util.getUserSettingUpdater()
          .updateSwimlane('label')
          .observer().take(1).subscribe(
          board => {
            new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3'], ['ONE-4', 'ONE-5'], []])
              .swimlanes([
                {key: 'L-10', name: 'L-10', issues: ['ONE-2', 'ONE-3']},
                {key: 'L-20', name: 'L-20', issues: ['ONE-2', 'ONE-4']},
                {key: 'L-30', name: 'L-30', issues: ['ONE-2', 'ONE-5']},
                {key: NONE_FILTER, name: 'None', issues: ['ONE-1']}])
              .checkBoard(board);
          });

        util.getUserSettingUpdater()
          .updateSwimlane('Custom-2')
          .observer().take(1).subscribe(
          board => {
            new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3'], ['ONE-4', 'ONE-5'], []])
              .swimlanes([
                {key: 'c2-A', name: 'First C2', issues: ['ONE-1', 'ONE-2', 'ONE-3']},
                {key: 'c2-B', name: 'Second C2', issues: ['ONE-4']},
                {key: NONE_FILTER, name: 'None', issues: ['ONE-5']}])
              .checkBoard(board);
          });
      });
    });

    describe('Add issues', () => {
      let originalView: BoardViewModel;
      let util: BoardViewObservableUtil;

      it('Project', () => {
        // Project is a bit different from the others in this test.

        util = createUtil(
          {swimlane: 'project'},
          {'ONE': [4, 3, 2, 1], 'TWO': [3, 2, 1]},
          new SwimlaneIssueFactory()
            .addIssue('ONE-1', 0)
            .addIssue('ONE-2', 0)
            .addIssue('ONE-3', 1)
            .addIssue('ONE-4', 2)
            .addIssue('TWO-1', 0)
            .addIssue('TWO-2', 1)
            .addIssue('TWO-3', 1));
        util.observer().take(1).subscribe(board => originalView = board);

        util
          .getBoardStateUpdater()
          .issueChanges({
            new: [
              {key: 'ONE-5', state: '1-1', summary: 'Test', priority: 'Blocker', type: 'bug'},
              {key: 'TWO-4', state: '2-1', summary: 'Test', priority: 'Major', type: 'task'}]
          })
          .rankChanges({ONE: [{index: 4, key: 'ONE-5'}], TWO: [{index: 3, key: 'TWO-4'}]})
          .emit()
          .observer().take(1).subscribe(
          board => {
            new BoardChecker([['ONE-2', 'ONE-1', 'ONE-5'], ['ONE-3', 'TWO-1', 'TWO-4'], ['ONE-4', 'TWO-3', 'TWO-2']])
              .swimlanes([
                {key: 'ONE', name: 'ONE', issues: ['ONE-1', 'ONE-2', 'ONE-3', 'ONE-4', 'ONE-5']},
                {key: 'TWO', name: 'TWO', issues: ['TWO-1', 'TWO-2', 'TWO-3', 'TWO-4']}])
              .checkBoard(board);

            new EqualityChecker()
              .addChangedSwimlaneColumns('ONE', 0)
              .addChangedSwimlaneColumns('TWO', 1)
              .check(originalView, board);
          });
      });


      it('Issue Type', () => {
        util = createUtilWithStandardIssues({swimlane: 'issue-type'});
        util.observer().take(1).subscribe(board => originalView = board);
        util
          .getBoardStateUpdater()
          .issueChanges({new: [{key: 'ONE-6', state: '1-1', summary: 'Test', priority: 'Major', type: 'task'}]})
          .rankChanges({ONE: [{index: 5, key: 'ONE-6'}]})
          .emit()
          .observer().take(1).subscribe(
          board => {
            new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3', 'ONE-6'], ['ONE-4', 'ONE-5'], []])
              .swimlanes([
                {key: 'task', name: 'task', issues: ['ONE-2', 'ONE-4', 'ONE-6']},
                {key: 'bug', name: 'bug', issues: ['ONE-1', 'ONE-3', 'ONE-5']}])
              .checkBoard(board);

            new EqualityChecker()
              .cleanSwimlanes('bug')
              .addChangedSwimlaneColumns('task', 0)
              .check(originalView, board);
          });
      });

      it('Priority', () => {
        util = createUtilWithStandardIssues({swimlane: 'priority'});
        util.observer().take(1).subscribe(board => originalView = board);
        util
          .getBoardStateUpdater()
          .issueChanges({new: [{key: 'ONE-6', state: '1-1', summary: 'Test', priority: 'Major', type: 'task'}]})
          .rankChanges({ONE: [{index: 5, key: 'ONE-6'}]})
          .emit()
          .observer().take(1).subscribe(
          board => {
            new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3', 'ONE-6'], ['ONE-4', 'ONE-5'], []])
              .swimlanes([
                {key: 'Blocker', name: 'Blocker', issues: ['ONE-1', 'ONE-3', 'ONE-5']},
                {key: 'Major', name: 'Major', issues: ['ONE-2', 'ONE-4', 'ONE-6']}])
              .checkBoard(board);

            new EqualityChecker()
              .cleanSwimlanes('Blocker')
              .addChangedSwimlaneColumns('Major', 0)
              .check(originalView, board);
          });
      });

      describe('Assignee', () => {

        beforeEach(() => {
          util = createUtilWithStandardIssues({swimlane: 'assignee'});
          util.observer().take(1).subscribe(board => originalView = board);

        });
        it('None', () => {
          util
            .getBoardStateUpdater()
            .issueChanges({new: [{key: 'ONE-6', state: '1-1', summary: 'Test', priority: 'Major', type: 'task'}]})
            .rankChanges({ONE: [{index: 5, key: 'ONE-6'}]})
            .emit()
            .observer().take(1).subscribe(
            board => {
              new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3', 'ONE-6'], ['ONE-4', 'ONE-5'], []])
                .swimlanes([
                  {key: 'bob', name: 'Bob Brent Barlow', issues: ['ONE-3']},
                  {key: 'kabir', name: 'Kabir Khan', issues: ['ONE-1', 'ONE-4']},
                  {key: NONE_FILTER, name: 'None', issues: ['ONE-2', 'ONE-5', 'ONE-6']}])
                .checkBoard(board);

              new EqualityChecker()
                .cleanSwimlanes('bob', 'kabir')
                .addChangedSwimlaneColumns(NONE_FILTER, 0)
                .check(originalView, board);
            });
        });
        it('Set', () => {
          util
            .getBoardStateUpdater()
            .issueChanges({
              new: [{
                key: 'ONE-6',
                state: '1-1',
                summary: 'Test',
                priority: 'Major',
                type: 'task',
                assignee: 'bob'
              }]
            })
            .rankChanges({ONE: [{index: 5, key: 'ONE-6'}]})
            .emit()
            .observer().take(1).subscribe(
            board => {
              new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3', 'ONE-6'], ['ONE-4', 'ONE-5'], []])
                .swimlanes([
                  {key: 'bob', name: 'Bob Brent Barlow', issues: ['ONE-3', 'ONE-6']},
                  {key: 'kabir', name: 'Kabir Khan', issues: ['ONE-1', 'ONE-4']},
                  {key: NONE_FILTER, name: 'None', issues: ['ONE-2', 'ONE-5']}])
                .checkBoard(board);

              new EqualityChecker()
                .cleanSwimlanes('kabir', NONE_FILTER)
                .addChangedSwimlaneColumns('bob', 0)
                .check(originalView, board);
            });
        });
      });

      describe('Components', () => {
        beforeEach(() => {
          util = createUtilWithStandardIssues({swimlane: 'component'});
          util.observer().take(1).subscribe(board => originalView = board);

        });
        it('None', () => {
          util
            .getBoardStateUpdater()
            .issueChanges({new: [{key: 'ONE-6', state: '1-1', summary: 'Test', priority: 'Major', type: 'task'}]})
            .rankChanges({ONE: [{index: 5, key: 'ONE-6'}]})
            .emit()
            .observer().take(1).subscribe(
            board => {
              new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3', 'ONE-6'], ['ONE-4', 'ONE-5'], []])
                .swimlanes([
                  {key: 'C-10', name: 'C-10', issues: ['ONE-1', 'ONE-4']},
                  {key: 'C-20', name: 'C-20', issues: ['ONE-2', 'ONE-4']},
                  {key: 'C-30', name: 'C-30', issues: ['ONE-3', 'ONE-4']},
                  {key: NONE_FILTER, name: 'None', issues: ['ONE-5', 'ONE-6']}])
                .checkBoard(board);

              new EqualityChecker()
                .cleanSwimlanes('C-10', 'C-20', 'C-30')
                .addChangedSwimlaneColumns(NONE_FILTER, 0)
                .check(originalView, board);
            });
        });
        it('One', () => {
          util
            .getBoardStateUpdater()
            .issueChanges({
              new: [{
                key: 'ONE-6',
                state: '1-1',
                summary: 'Test',
                priority: 'Major',
                type: 'task',
                components: ['C-10']
              }]
            })
            .rankChanges({ONE: [{index: 5, key: 'ONE-6'}]})
            .emit()
            .observer().take(1).subscribe(
            board => {
              new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3', 'ONE-6'], ['ONE-4', 'ONE-5'], []])
                .swimlanes([
                  {key: 'C-10', name: 'C-10', issues: ['ONE-1', 'ONE-4', 'ONE-6']},
                  {key: 'C-20', name: 'C-20', issues: ['ONE-2', 'ONE-4']},
                  {key: 'C-30', name: 'C-30', issues: ['ONE-3', 'ONE-4']},
                  {key: NONE_FILTER, name: 'None', issues: ['ONE-5']}])
                .checkBoard(board);

              new EqualityChecker()
                .cleanSwimlanes('C-20', 'C-30', NONE_FILTER)
                .addChangedSwimlaneColumns('C-10', 0)
                .check(originalView, board);

            });
        });
        it('Several', () => {
          util
            .getBoardStateUpdater()
            .issueChanges({
              new:
                [{
                  key: 'ONE-6',
                  state: '1-1',
                  summary: 'Test',
                  priority: 'Major',
                  type: 'task',
                  components: ['C-10', 'C-20']
                }]
            })
            .rankChanges({ONE: [{index: 5, key: 'ONE-6'}]})
            .emit()
            .observer().take(1).subscribe(
            board => {
              new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3', 'ONE-6'], ['ONE-4', 'ONE-5'], []])
                .swimlanes([
                  {key: 'C-10', name: 'C-10', issues: ['ONE-1', 'ONE-4', 'ONE-6']},
                  {key: 'C-20', name: 'C-20', issues: ['ONE-2', 'ONE-4', 'ONE-6']},
                  {key: 'C-30', name: 'C-30', issues: ['ONE-3', 'ONE-4']},
                  {key: NONE_FILTER, name: 'None', issues: ['ONE-5']}])
                .checkBoard(board);

              new EqualityChecker()
                .cleanSwimlanes('C-30', NONE_FILTER)
                .addChangedSwimlaneColumns('C-10', 0)
                .addChangedSwimlaneColumns('C-20', 0)
                .check(originalView, board);
            });
        });
      });

      describe('Fix Versions', () => {
        beforeEach(() => {
          util = createUtilWithStandardIssues({swimlane: 'fix-version'});
          util.observer().take(1).subscribe(board => originalView = board);

        });
        it('None', () => {
          util
            .getBoardStateUpdater()
            .issueChanges({new: [{key: 'ONE-6', state: '1-1', summary: 'Test', priority: 'Major', type: 'task'}]})
            .rankChanges({ONE: [{index: 5, key: 'ONE-6'}]})
            .emit()
            .observer().take(1).subscribe(
            board => {
              new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3', 'ONE-6'], ['ONE-4', 'ONE-5'], []])
                .swimlanes([
                  {key: 'F-10', name: 'F-10', issues: ['ONE-1', 'ONE-2']},
                  {key: 'F-20', name: 'F-20', issues: ['ONE-1', 'ONE-3']},
                  {key: 'F-30', name: 'F-30', issues: ['ONE-1', 'ONE-5']},
                  {key: NONE_FILTER, name: 'None', issues: ['ONE-4', 'ONE-6']}])
                .checkBoard(board);

              new EqualityChecker()
                .cleanSwimlanes('F-10', 'F-20', 'F-30')
                .addChangedSwimlaneColumns(NONE_FILTER, 0)
                .check(originalView, board);
            });
        });
        it('One', () => {
          util
            .getBoardStateUpdater()
            .issueChanges({
              new: [{
                key: 'ONE-6',
                state: '1-1',
                summary: 'Test',
                priority: 'Major',
                type: 'task',
                'fix-versions': ['F-10']
              }]
            })
            .rankChanges({ONE: [{index: 5, key: 'ONE-6'}]})
            .emit()
            .observer().take(1).subscribe(
            board => {
              new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3', 'ONE-6'], ['ONE-4', 'ONE-5'], []])
                .swimlanes([
                  {key: 'F-10', name: 'F-10', issues: ['ONE-1', 'ONE-2', 'ONE-6']},
                  {key: 'F-20', name: 'F-20', issues: ['ONE-1', 'ONE-3']},
                  {key: 'F-30', name: 'F-30', issues: ['ONE-1', 'ONE-5']},
                  {key: NONE_FILTER, name: 'None', issues: ['ONE-4']}])
                .checkBoard(board);

              new EqualityChecker()
                .cleanSwimlanes('F-20', 'F-30', NONE_FILTER)
                .addChangedSwimlaneColumns('F-10', 0)
                .check(originalView, board);
            });
        });
        it('Several', () => {
          util
            .getBoardStateUpdater()
            .issueChanges({
              new:
                [{
                  key: 'ONE-6',
                  state: '1-1',
                  summary: 'Test',
                  priority: 'Major',
                  type: 'task',
                  'fix-versions': ['F-10', 'F-20']
                }]
            })
            .rankChanges({ONE: [{index: 5, key: 'ONE-6'}]})
            .emit()
            .observer().take(1).subscribe(
            board => {
              new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3', 'ONE-6'], ['ONE-4', 'ONE-5'], []])
                .swimlanes([
                  {key: 'F-10', name: 'F-10', issues: ['ONE-1', 'ONE-2', 'ONE-6']},
                  {key: 'F-20', name: 'F-20', issues: ['ONE-1', 'ONE-3', 'ONE-6']},
                  {key: 'F-30', name: 'F-30', issues: ['ONE-1', 'ONE-5']},
                  {key: NONE_FILTER, name: 'None', issues: ['ONE-4']}])
                .checkBoard(board);

              new EqualityChecker()
                .cleanSwimlanes('F-30', NONE_FILTER)
                .addChangedSwimlaneColumns('F-10', 0)
                .addChangedSwimlaneColumns('F-20', 0)
                .check(originalView, board);
            });
        });
      });

      describe('Labels', () => {
        beforeEach(() => {
          util = createUtilWithStandardIssues({swimlane: 'label'});
          util.observer().take(1).subscribe(board => originalView = board);

        });
        it('None', () => {
          util
            .getBoardStateUpdater()
            .issueChanges({new: [{key: 'ONE-6', state: '1-1', summary: 'Test', priority: 'Major', type: 'task'}]})
            .rankChanges({ONE: [{index: 5, key: 'ONE-6'}]})
            .emit()
            .observer().take(1).subscribe(
            board => {
              new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3', 'ONE-6'], ['ONE-4', 'ONE-5'], []])
                .swimlanes([
                  {key: 'L-10', name: 'L-10', issues: ['ONE-2', 'ONE-3']},
                  {key: 'L-20', name: 'L-20', issues: ['ONE-2', 'ONE-4']},
                  {key: 'L-30', name: 'L-30', issues: ['ONE-2', 'ONE-5']},
                  {key: NONE_FILTER, name: 'None', issues: ['ONE-1', 'ONE-6']}])
                .checkBoard(board);

              new EqualityChecker()
                .cleanSwimlanes('L-10', 'L-20', 'L-30')
                .addChangedSwimlaneColumns(NONE_FILTER, 0)
                .check(originalView, board);
            });
        });
        it('One', () => {
          util
            .getBoardStateUpdater()
            .issueChanges({
              new: [{
                key: 'ONE-6',
                state: '1-1',
                summary: 'Test',
                priority: 'Major',
                type: 'task',
                labels: ['L-10']
              }]
            })
            .rankChanges({ONE: [{index: 5, key: 'ONE-6'}]})
            .emit()
            .observer().take(1).subscribe(
            board => {
              new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3', 'ONE-6'], ['ONE-4', 'ONE-5'], []])
                .swimlanes([
                  {key: 'L-10', name: 'L-10', issues: ['ONE-2', 'ONE-3', 'ONE-6']},
                  {key: 'L-20', name: 'L-20', issues: ['ONE-2', 'ONE-4']},
                  {key: 'L-30', name: 'L-30', issues: ['ONE-2', 'ONE-5']},
                  {key: NONE_FILTER, name: 'None', issues: ['ONE-1']}])
                .checkBoard(board);

              new EqualityChecker()
                .cleanSwimlanes('L-20', 'L-30', NONE_FILTER)
                .addChangedSwimlaneColumns('L-10', 0)
                .check(originalView, board);
            });
        });
        it('Several', () => {
          util
            .getBoardStateUpdater()
            .issueChanges({
              new:
                [{
                  key: 'ONE-6',
                  state: '1-1',
                  summary: 'Test',
                  priority: 'Major',
                  type: 'task',
                  labels: ['L-10', 'L-20']
                }]
            })
            .rankChanges({ONE: [{index: 5, key: 'ONE-6'}]})
            .emit()
            .observer().take(1).subscribe(
            board => {
              new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3', 'ONE-6'], ['ONE-4', 'ONE-5'], []])
                .swimlanes([
                  {key: 'L-10', name: 'L-10', issues: ['ONE-2', 'ONE-3', 'ONE-6']},
                  {key: 'L-20', name: 'L-20', issues: ['ONE-2', 'ONE-4', 'ONE-6']},
                  {key: 'L-30', name: 'L-30', issues: ['ONE-2', 'ONE-5']},
                  {key: NONE_FILTER, name: 'None', issues: ['ONE-1']}])
                .checkBoard(board);

              new EqualityChecker()
                .cleanSwimlanes('L-30', NONE_FILTER)
                .addChangedSwimlaneColumns('L-10', 0)
                .addChangedSwimlaneColumns('L-20', 0)
                .check(originalView, board);
            });
        });
      });
      describe('CustomField', () => {
        beforeEach(() => {
          util = createUtilWithStandardIssues({swimlane: 'Custom-2'});
          util.observer().take(1).subscribe(board => originalView = board);

        });
        it('None', () => {
          util
            .getBoardStateUpdater()
            .issueChanges({
              new:
                [{key: 'ONE-6', state: '1-1', summary: 'Test', priority: 'Major', type: 'task'}]
            })
            .rankChanges({ONE: [{index: 5, key: 'ONE-6'}]})
            .emit()
            .observer().take(1).subscribe(
            board => {
              new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3', 'ONE-6'], ['ONE-4', 'ONE-5'], []])
                .swimlanes([
                  {key: 'c2-A', name: 'First C2', issues: ['ONE-1', 'ONE-2', 'ONE-3']},
                  {key: 'c2-B', name: 'Second C2', issues: ['ONE-4']},
                  {key: NONE_FILTER, name: 'None', issues: ['ONE-5', 'ONE-6']}])
                .checkBoard(board);

              new EqualityChecker()
                .cleanSwimlanes('c2-A', 'c2-B')
                .addChangedSwimlaneColumns(NONE_FILTER, 0)
                .check(originalView, board);
            });
        });
        it('Set', () => {
          util
            .getBoardStateUpdater()
            .issueChanges({
              new:
                [{
                  key: 'ONE-6',
                  state: '1-1',
                  summary: 'Test',
                  priority: 'Major',
                  type: 'task',
                  custom: {'Custom-2': 'c2-B'}
                }]
            })
            .rankChanges({ONE: [{index: 5, key: 'ONE-6'}]})
            .emit()
            .observer().take(1).subscribe(
            board => {
              new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3', 'ONE-6'], ['ONE-4', 'ONE-5'], []])
                .swimlanes([
                  {key: 'c2-A', name: 'First C2', issues: ['ONE-1', 'ONE-2', 'ONE-3']},
                  {key: 'c2-B', name: 'Second C2', issues: ['ONE-4', 'ONE-6']},
                  {key: NONE_FILTER, name: 'None', issues: ['ONE-5']}])
                .checkBoard(board);

              new EqualityChecker()
                .cleanSwimlanes('c2-A', NONE_FILTER)
                .addChangedSwimlaneColumns('c2-B', 0)
                .check(originalView, board);
            });
        });
      });
    });

    describe('Update Issue', () => {
      let originalView: BoardViewModel;
      let util: BoardViewObservableUtil;
      describe('Remain in same swimlane', () => {
        it('Change state', () => {
          util = createUtilWithStandardIssues({swimlane: 'issue-type'});
          util.observer().take(1).subscribe(board => originalView = board);
          util
            .getBoardStateUpdater()
            .issueChanges({update: [{key: 'ONE-1', state: '1-3'}]})
            .emit()
            .observer().take(1).subscribe(
            board => {
              new BoardChecker([['ONE-2', 'ONE-3'], ['ONE-4', 'ONE-5'], ['ONE-1']])
                .swimlanes([
                  {key: 'task', name: 'task', issues: ['ONE-2', 'ONE-4']},
                  {key: 'bug', name: 'bug', issues: ['ONE-1', 'ONE-3', 'ONE-5']}])
                .checkBoard(board);

              new EqualityChecker()
                .cleanSwimlanes('task')
                .addChangedSwimlaneColumns('bug', 0, 2)
                .check(originalView, board);
            });
        });
        it('Change rank - not affecting states or swimlanes', () => {

          util = createUtilWithStandardIssues({swimlane: 'issue-type'});
          util.observer().take(1).subscribe(board => originalView = board);
          util
            .getBoardStateUpdater()
            .rankChanges({ONE: [{index: 4, key: 'ONE-3'}]})
            .emit()
            .observer().take(1).subscribe(
            board => {
              new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3'], ['ONE-4', 'ONE-5'], []])
                .swimlanes([
                  {key: 'task', name: 'task', issues: ['ONE-2', 'ONE-4']},
                  {key: 'bug', name: 'bug', issues: ['ONE-1', 'ONE-3', 'ONE-5']}])
                .checkBoard(board);

              expect(board).toBe(originalView);
            });
        });
        it('Delete issue', () => {
          util = createUtilWithStandardIssues({swimlane: 'issue-type'});
          util.observer().take(1).subscribe(board => originalView = board);
          util
            .getBoardStateUpdater()
            .issueChanges({delete: ['ONE-5']})
            .emit()
            .observer().take(1).subscribe(
            board => {
              new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3'], ['ONE-4'], []])
                .swimlanes([
                  {key: 'task', name: 'task', issues: ['ONE-2', 'ONE-4']},
                  {key: 'bug', name: 'bug', issues: ['ONE-1', 'ONE-3']}])
                .checkBoard(board);

              new EqualityChecker()
                .cleanSwimlanes('task')
                .addChangedSwimlaneColumns('bug', 1)
                .check(originalView, board);
            });
        });
      });

      describe('Change swimlane', () => {
        // Don't do project since a move there is basically a delete and an add which we test elsew

        it('Issue Type', () => {
          util = createUtilWithStandardIssues({swimlane: 'issue-type'});
          util.observer().take(1).subscribe(board => originalView = board);
          util
            .getBoardStateUpdater()
            .issueChanges({update: [{key: 'ONE-1', type: 'task'}]})
            .emit()
            .observer().take(1).subscribe(
            board => {
              new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3'], ['ONE-4', 'ONE-5'], []])
                .swimlanes([
                  {key: 'task', name: 'task', issues: ['ONE-1', 'ONE-2', 'ONE-4']},
                  {key: 'bug', name: 'bug', issues: ['ONE-3', 'ONE-5']}])
                .checkBoard(board);

              new EqualityChecker()
                .addChangedSwimlaneColumns('task', 0)
                .addChangedSwimlaneColumns('bug', 0)
                .check(originalView, board);
            });
        });

        it('Priority', () => {
          util = createUtilWithStandardIssues({swimlane: 'priority'});
          util.observer().take(1).subscribe(board => originalView = board);
          util
            .getBoardStateUpdater()
            .issueChanges({update: [{key: 'ONE-2', priority: 'Blocker'}]})
            .emit()
            .observer().take(1).subscribe(
            board => {
              new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3'], ['ONE-4', 'ONE-5'], []])
                .swimlanes([
                  {key: 'Blocker', name: 'Blocker', issues: ['ONE-1', 'ONE-2', 'ONE-3', 'ONE-5']},
                  {key: 'Major', name: 'Major', issues: ['ONE-4']}])
                .checkBoard(board);

              new EqualityChecker()
                .addChangedSwimlaneColumns('Blocker', 0)
                .addChangedSwimlaneColumns('Major', 0)
                .check(originalView, board);
            });
        });
        describe('Assignee', () => {
          beforeEach(() => {
            util = createUtilWithStandardIssues({swimlane: 'assignee'});
            util.observer().take(1).subscribe(board => originalView = board);

          });
          it('None', () => {
            util
              .getBoardStateUpdater()
              .issueChanges({
                update: [{
                  key: 'ONE-1',
                  state: '1-1',
                  summary: 'Test',
                  priority: 'Major',
                  type: 'task',
                  unassigned: true
                }]
              })
              .emit()
              .observer().take(1).subscribe(
              board => {
                new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3'], ['ONE-4', 'ONE-5'], []])
                  .swimlanes([
                    {key: 'bob', name: 'Bob Brent Barlow', issues: ['ONE-3']},
                    {key: 'kabir', name: 'Kabir Khan', issues: ['ONE-4']},
                    {key: NONE_FILTER, name: 'None', issues: ['ONE-1', 'ONE-2', 'ONE-5']}])
                  .checkBoard(board);

                new EqualityChecker()
                  .cleanSwimlanes('bob')
                  .addChangedSwimlaneColumns('kabir', 0)
                  .addChangedSwimlaneColumns(NONE_FILTER, 0)
                  .check(originalView, board);
              });
          });
          it('Set', () => {
            util
              .getBoardStateUpdater()
              .issueChanges({update: [{key: 'ONE-2', assignee: 'bob'}]})
              .emit()
              .observer().take(1).subscribe(
              board => {
                new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3'], ['ONE-4', 'ONE-5'], []])
                  .swimlanes([
                    {key: 'bob', name: 'Bob Brent Barlow', issues: ['ONE-2', 'ONE-3']},
                    {key: 'kabir', name: 'Kabir Khan', issues: ['ONE-1', 'ONE-4']},
                    {key: NONE_FILTER, name: 'None', issues: ['ONE-5']}])
                  .checkBoard(board);

                new EqualityChecker()
                  .cleanSwimlanes('kabir')
                  .addChangedSwimlaneColumns('bob', 0)
                  .addChangedSwimlaneColumns(NONE_FILTER, 0)
                  .check(originalView, board);
              });
          });
        });
        describe('Components', () => {
          beforeEach(() => {
            util = createUtilWithStandardIssues({swimlane: 'component'});
            util.observer().take(1).subscribe(board => originalView = board);

          });
          it('None', () => {
            util
              .getBoardStateUpdater()
              .issueChanges({update: [{key: 'ONE-4', 'clear-components': true}]})
              .emit()
              .observer().take(1).subscribe(
              board => {
                new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3'], ['ONE-4', 'ONE-5'], []])
                  .swimlanes([
                    {key: 'C-10', name: 'C-10', issues: ['ONE-1']},
                    {key: 'C-20', name: 'C-20', issues: ['ONE-2']},
                    {key: 'C-30', name: 'C-30', issues: ['ONE-3']},
                    {key: NONE_FILTER, name: 'None', issues: ['ONE-4', 'ONE-5']}])
                  .checkBoard(board);

                new EqualityChecker()
                  .addChangedSwimlaneColumns('C-10', 1)
                  .addChangedSwimlaneColumns('C-20', 1)
                  .addChangedSwimlaneColumns('C-30', 1)
                  .addChangedSwimlaneColumns(NONE_FILTER, 1)
                  .check(originalView, board);
              });
          });
          it('One', () => {
            util
              .getBoardStateUpdater()
              .issueChanges({update: [{key: 'ONE-3', components: ['C-10']}]})
              .emit()
              .observer().take(1).subscribe(
              board => {
                new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3'], ['ONE-4', 'ONE-5'], []])
                  .swimlanes([
                    {key: 'C-10', name: 'C-10', issues: ['ONE-1', 'ONE-3', 'ONE-4']},
                    {key: 'C-20', name: 'C-20', issues: ['ONE-2', 'ONE-4']},
                    {key: 'C-30', name: 'C-30', issues: ['ONE-4']},
                    {key: NONE_FILTER, name: 'None', issues: ['ONE-5']}])
                  .checkBoard(board);

                new EqualityChecker()
                  .cleanSwimlanes('C-20', NONE_FILTER)
                  .addChangedSwimlaneColumns('C-10', 0)
                  .addChangedSwimlaneColumns('C-30', 0)
                  .check(originalView, board);
              });
          });
          it('Several', () => {
            util
              .getBoardStateUpdater()
              .issueChanges({
                update:
                  [{key: 'ONE-3', components: ['C-10', 'C-20']}]
              })
              .emit()
              .observer().take(1).subscribe(
              board => {
                new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3'], ['ONE-4', 'ONE-5'], []])
                  .swimlanes([
                    {key: 'C-10', name: 'C-10', issues: ['ONE-1', 'ONE-3', 'ONE-4']},
                    {key: 'C-20', name: 'C-20', issues: ['ONE-2', 'ONE-3', 'ONE-4']},
                    {key: 'C-30', name: 'C-30', issues: ['ONE-4']},
                    {key: NONE_FILTER, name: 'None', issues: ['ONE-5']}])
                  .checkBoard(board);

                new EqualityChecker()
                  .cleanSwimlanes(NONE_FILTER)
                  .addChangedSwimlaneColumns('C-10', 0)
                  .addChangedSwimlaneColumns('C-20', 0)
                  .addChangedSwimlaneColumns('C-30', 0)
                  .check(originalView, board);
              });
          });
        });
        describe('Fix Versions', () => {
          beforeEach(() => {
            util = createUtilWithStandardIssues({swimlane: 'fix-version'});
            util.observer().take(1).subscribe(board => originalView = board);

          });
          it('None', () => {
            util
              .getBoardStateUpdater()
              .issueChanges({update: [{key: 'ONE-2', 'clear-fix-versions': true}]})
              .emit()
              .observer().take(1).subscribe(
              board => {
                new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3'], ['ONE-4', 'ONE-5'], []])
                  .swimlanes([
                    {key: 'F-10', name: 'F-10', issues: ['ONE-1']},
                    {key: 'F-20', name: 'F-20', issues: ['ONE-1', 'ONE-3']},
                    {key: 'F-30', name: 'F-30', issues: ['ONE-1', 'ONE-5']},
                    {key: NONE_FILTER, name: 'None', issues: ['ONE-2', 'ONE-4']}])
                  .checkBoard(board);

                new EqualityChecker()
                  .cleanSwimlanes('F-20', 'F-30')
                  .addChangedSwimlaneColumns('F-10', 0)
                  .addChangedSwimlaneColumns(NONE_FILTER, 0)
                  .check(originalView, board);
              });
          });
          it('One', () => {
            util
              .getBoardStateUpdater()
              .issueChanges({
                update:
                  [{
                    key: 'ONE-2',
                    state: '1-1',
                    summary: 'Test',
                    priority: 'Major',
                    type: 'task',
                    'fix-versions': ['F-20']
                  }]
              })
              .emit()
              .observer().take(1).subscribe(
              board => {
                new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3'], ['ONE-4', 'ONE-5'], []])
                  .swimlanes([
                    {key: 'F-10', name: 'F-10', issues: ['ONE-1']},
                    {key: 'F-20', name: 'F-20', issues: ['ONE-1', 'ONE-2', 'ONE-3']},
                    {key: 'F-30', name: 'F-30', issues: ['ONE-1', 'ONE-5']},
                    {key: NONE_FILTER, name: 'None', issues: ['ONE-4']}])
                  .checkBoard(board);

                new EqualityChecker()
                  .cleanSwimlanes('F-30', NONE_FILTER)
                  .addChangedSwimlaneColumns('F-10', 0)
                  .addChangedSwimlaneColumns('F-20', 0)
                  .check(originalView, board);
              });
          });
          it('Several', () => {
            util
              .getBoardStateUpdater()
              .issueChanges({
                update:
                  [{key: 'ONE-2', 'fix-versions': ['F-10', 'F-20']}]
              })
              .emit()
              .observer().take(1).subscribe(
              board => {
                new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3'], ['ONE-4', 'ONE-5'], []])
                  .swimlanes([
                    {key: 'F-10', name: 'F-10', issues: ['ONE-1', 'ONE-2']},
                    {key: 'F-20', name: 'F-20', issues: ['ONE-1', 'ONE-2', 'ONE-3']},
                    {key: 'F-30', name: 'F-30', issues: ['ONE-1', 'ONE-5']},
                    {key: NONE_FILTER, name: 'None', issues: ['ONE-4']}])
                  .checkBoard(board);

                new EqualityChecker()
                // Although we set F-10, it was used in the original data
                  .cleanSwimlanes('F-10', 'F-30', NONE_FILTER)
                  .addChangedSwimlaneColumns('F-20', 0)
                  .check(originalView, board);
              });
          });
        });
        describe('Labels', () => {
          beforeEach(() => {
            util = createUtilWithStandardIssues({swimlane: 'label'});
            util.observer().take(1).subscribe(board => originalView = board);

          });
          it('None', () => {
            util
              .getBoardStateUpdater()
              .issueChanges({update: [{key: 'ONE-4', 'clear-labels': true}]})
              .emit()
              .observer().take(1).subscribe(
              board => {
                new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3'], ['ONE-4', 'ONE-5'], []])
                  .swimlanes([
                    {key: 'L-10', name: 'L-10', issues: ['ONE-2', 'ONE-3']},
                    {key: 'L-20', name: 'L-20', issues: ['ONE-2']},
                    {key: 'L-30', name: 'L-30', issues: ['ONE-2', 'ONE-5']},
                    {key: NONE_FILTER, name: 'None', issues: ['ONE-1', 'ONE-4']}])
                  .checkBoard(board);

                new EqualityChecker()
                  .cleanSwimlanes('L-10', 'L-30')
                  .addChangedSwimlaneColumns('L-20', 1)
                  .addChangedSwimlaneColumns(NONE_FILTER, 1)
                  .check(originalView, board);
              });
          });
          it('One', () => {
            util
              .getBoardStateUpdater()
              .issueChanges({update: [{key: 'ONE-4', labels: ['L-10']}]})
              .emit()
              .observer().take(1).subscribe(
              board => {
                new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3'], ['ONE-4', 'ONE-5'], []])
                  .swimlanes([
                    {key: 'L-10', name: 'L-10', issues: ['ONE-2', 'ONE-3', 'ONE-4']},
                    {key: 'L-20', name: 'L-20', issues: ['ONE-2']},
                    {key: 'L-30', name: 'L-30', issues: ['ONE-2', 'ONE-5']},
                    {key: NONE_FILTER, name: 'None', issues: ['ONE-1']}])
                  .checkBoard(board);


                new EqualityChecker()
                  .cleanSwimlanes('L-30', NONE_FILTER)
                  .addChangedSwimlaneColumns('L-10', 1)
                  .addChangedSwimlaneColumns('L-20', 1)
                  .check(originalView, board);
              });
          });
          it('Several', () => {
            util
              .getBoardStateUpdater()
              .issueChanges({
                update:
                  [{key: 'ONE-5', labels: ['L-10', 'L-20']}]
              })
              .emit()
              .observer().take(1).subscribe(
              board => {
                new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3'], ['ONE-4', 'ONE-5'], []])
                  .swimlanes([
                    {key: 'L-10', name: 'L-10', issues: ['ONE-2', 'ONE-3', 'ONE-5']},
                    {key: 'L-20', name: 'L-20', issues: ['ONE-2', 'ONE-4', 'ONE-5']},
                    {key: 'L-30', name: 'L-30', issues: ['ONE-2']},
                    {key: NONE_FILTER, name: 'None', issues: ['ONE-1']}])
                  .checkBoard(board);

                new EqualityChecker()
                  .cleanSwimlanes(NONE_FILTER)
                  .addChangedSwimlaneColumns('L-10', 1)
                  .addChangedSwimlaneColumns('L-20', 1)
                  .addChangedSwimlaneColumns('L-30', 1)
                  .check(originalView, board);
              });
          });
        });
        describe('CustomField', () => {
          beforeEach(() => {
            util = createUtilWithStandardIssues({swimlane: 'Custom-2'});
            util.observer().take(1).subscribe(board => originalView = board);

          });
          it('None', () => {
            util
              .getBoardStateUpdater()
              .issueChanges({update: [{key: 'ONE-2', custom: {'Custom-2': null}}]})
              .emit()
              .observer().take(1).subscribe(
              board => {
                new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3'], ['ONE-4', 'ONE-5'], []])
                  .swimlanes([
                    {key: 'c2-A', name: 'First C2', issues: ['ONE-1', 'ONE-3']},
                    {key: 'c2-B', name: 'Second C2', issues: ['ONE-4']},
                    {key: NONE_FILTER, name: 'None', issues: ['ONE-2', 'ONE-5']}])
                  .checkBoard(board);


                new EqualityChecker()
                  .cleanSwimlanes('c2-B')
                  .addChangedSwimlaneColumns('c2-A', 0)
                  .addChangedSwimlaneColumns(NONE_FILTER, 0)
                  .check(originalView, board);
              });
          });
          it('Set', () => {
            util
              .getBoardStateUpdater()
              .issueChanges({
                update:
                  [{key: 'ONE-3', custom: {'Custom-2': 'c2-B'}}]
              })
              .emit()
              .observer().take(1).subscribe(
              board => {
                new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3'], ['ONE-4', 'ONE-5'], []])
                  .swimlanes([
                    {key: 'c2-A', name: 'First C2', issues: ['ONE-1', 'ONE-2']},
                    {key: 'c2-B', name: 'Second C2', issues: ['ONE-4', 'ONE-3']},
                    {key: NONE_FILTER, name: 'None', issues: ['ONE-5']}])
                  .checkBoard(board);

                new EqualityChecker()
                  .cleanSwimlanes(NONE_FILTER)
                  .addChangedSwimlaneColumns('c2-A', 0)
                  .addChangedSwimlaneColumns('c2-B', 0)
                  .check(originalView, board);
              });
          });
        });
      });
    });

    describe('Filters', () => {
      let originalView: BoardViewModel;
      let util: BoardViewObservableUtil;

      describe('Matching selected swimlane', () => {
        /**
         * Do a few different combinations of what we update. We don't need to redo it every time
         */
        it('Project', () => {
          // Project is a bit different from the others in this test
          util = createUtil(
            {swimlane: 'project', project: 'ONE'},
            {'ONE': [4, 3, 2, 1], 'TWO': [3, 2, 1]},
            new SwimlaneIssueFactory()
              .addIssue('ONE-1', 0)
              .addIssue('ONE-2', 0)
              .addIssue('ONE-3', 1)
              .addIssue('ONE-4', 2)
              .addIssue('TWO-1', 0)
              .addIssue('TWO-2', 1)
              .addIssue('TWO-3', 1));
          util.observer().take(1).subscribe(
            board => {
              new BoardChecker([['ONE-2', 'ONE-1'], ['ONE-3', 'TWO-1'], ['ONE-4', 'TWO-3', 'TWO-2']])
                .invisibleIssues(['TWO-1', 'TWO-2', 'TWO-3'])
                .swimlanes([
                  {key: 'ONE', name: 'ONE', issues: ['ONE-1', 'ONE-2', 'ONE-3', 'ONE-4'], visibleFilter: true},
                  {key: 'TWO', name: 'TWO', issues: ['TWO-1', 'TWO-2', 'TWO-3'], visibleFilter: false}])
                .checkBoard(board);
              originalView = board;
            });
          util.getUserSettingUpdater().updateFilters('project')
            .observer().take(1).subscribe(
            board => {
              new BoardChecker([['ONE-2', 'ONE-1'], ['ONE-3', 'TWO-1'], ['ONE-4', 'TWO-3', 'TWO-2']])
                .swimlanes([
                  {key: 'ONE', name: 'ONE', issues: ['ONE-1', 'ONE-2', 'ONE-3', 'ONE-4'], visibleFilter: true},
                  {key: 'TWO', name: 'TWO', issues: ['TWO-1', 'TWO-2', 'TWO-3'], visibleFilter: true}])
                .checkBoard(board);
              new EqualityChecker()
                .cleanSwimlanes('ONE')
                .cleanSwimlaneTables('TWO')
                .check(originalView, board);
              originalView = board;
            });

          util.getUserSettingUpdater().updateFilters('project', 'TWO')
            .observer().take(1).subscribe(
            board => {
              new BoardChecker([['ONE-2', 'ONE-1'], ['ONE-3', 'TWO-1'], ['ONE-4', 'TWO-3', 'TWO-2']])
                .invisibleIssues(['ONE-1', 'ONE-2', 'ONE-3', 'ONE-4'])
                .swimlanes([
                  {key: 'ONE', name: 'ONE', issues: ['ONE-1', 'ONE-2', 'ONE-3', 'ONE-4'], visibleFilter: false},
                  {key: 'TWO', name: 'TWO', issues: ['TWO-1', 'TWO-2', 'TWO-3'], visibleFilter: true}])
                .checkBoard(board);
              new EqualityChecker()
                .cleanSwimlanes('TWO')
                .cleanSwimlaneTables('ONE')
                .check(originalView, board);
              originalView = board;
            });
          util.getUserSettingUpdater().updateFilters('project', 'ONE', 'TWO')
            .observer().take(1).subscribe(
            board => {
              new BoardChecker([['ONE-2', 'ONE-1'], ['ONE-3', 'TWO-1'], ['ONE-4', 'TWO-3', 'TWO-2']])
                .swimlanes([
                  {key: 'ONE', name: 'ONE', issues: ['ONE-1', 'ONE-2', 'ONE-3', 'ONE-4'], visibleFilter: true},
                  {key: 'TWO', name: 'TWO', issues: ['TWO-1', 'TWO-2', 'TWO-3'], visibleFilter: true}])
                .checkBoard(board);
              new EqualityChecker()
                .cleanSwimlanes('TWO')
                .cleanSwimlaneTables('ONE')
                .check(originalView, board);
            });
        });
        it('Issue Type', () => {
          util = createUtilWithStandardIssues({swimlane: 'issue-type', 'issue-type': 'bug'});
          util.observer().take(1).subscribe(
            board => {
              new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3'], ['ONE-4', 'ONE-5'], []])
                .invisibleIssues(['ONE-2', 'ONE-4'])
                .swimlanes([
                  {key: 'task', name: 'task', issues: ['ONE-2', 'ONE-4'], visibleFilter: false},
                  {key: 'bug', name: 'bug', issues: ['ONE-1', 'ONE-3', 'ONE-5'], visibleFilter: true}])
                .checkBoard(board);
              originalView = board;
            });
          util.getUserSettingUpdater().updateFilters('issue-type', 'task')
            .observer().take(1).subscribe(board => {
            new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3'], ['ONE-4', 'ONE-5'], []])
              .invisibleIssues(['ONE-1', 'ONE-3', 'ONE-5'])
              .swimlanes([
                {key: 'task', name: 'task', issues: ['ONE-2', 'ONE-4'], visibleFilter: true},
                {key: 'bug', name: 'bug', issues: ['ONE-1', 'ONE-3', 'ONE-5'], visibleFilter: false}])
              .checkBoard(board);
            new EqualityChecker()
              .cleanSwimlaneTables('task', 'bug')
              .check(originalView, board);
          });
        });
        it('Priority', () => {
          util = createUtilWithStandardIssues({swimlane: 'priority', 'priority': 'Blocker'});
          util.observer().take(1).subscribe(
            board => {
              new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3'], ['ONE-4', 'ONE-5'], []])
                .invisibleIssues(['ONE-2', 'ONE-4'])
                .swimlanes([
                  {key: 'Blocker', name: 'Blocker', issues: ['ONE-1', 'ONE-3', 'ONE-5'], visibleFilter: true},
                  {key: 'Major', name: 'Major', issues: ['ONE-2', 'ONE-4'], visibleFilter: false}])
                .checkBoard(board);
              originalView = board;
            });
          util.getUserSettingUpdater().updateFilters('priority', 'Major')
            .observer().take(1).subscribe(board => {
            new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3'], ['ONE-4', 'ONE-5'], []])
              .invisibleIssues(['ONE-1', 'ONE-3', 'ONE-5'])
              .swimlanes([
                {key: 'Blocker', name: 'Blocker', issues: ['ONE-1', 'ONE-3', 'ONE-5'], visibleFilter: false},
                {key: 'Major', name: 'Major', issues: ['ONE-2', 'ONE-4'], visibleFilter: true}])
              .checkBoard(board);
            new EqualityChecker()
              .cleanSwimlaneTables('Blocker', 'Major')
              .check(originalView, board);
          });
        });
        it('Assignee', () => {
          util = createUtilWithStandardIssues({swimlane: 'assignee', 'assignee': 'kabir'});
          util.observer().take(1).subscribe(
            board => {
              new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3'], ['ONE-4', 'ONE-5'], []])
                .invisibleIssues(['ONE-3', 'ONE-2', 'ONE-5'])
                .swimlanes([
                  {key: 'bob', name: 'Bob Brent Barlow', issues: ['ONE-3'], visibleFilter: false},
                  {key: 'kabir', name: 'Kabir Khan', issues: ['ONE-1', 'ONE-4'], visibleFilter: true},
                  {key: NONE_FILTER, name: 'None', issues: ['ONE-2', 'ONE-5'], visibleFilter: false}])
                .checkBoard(board);
              originalView = board;
            });
          util.getUserSettingUpdater().updateFilters('assignee', 'kabir', NONE_FILTER)
            .observer().take(1).subscribe(board => {
            new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3'], ['ONE-4', 'ONE-5'], []])
              .invisibleIssues(['ONE-3'])
              .swimlanes([
                {key: 'bob', name: 'Bob Brent Barlow', issues: ['ONE-3'], visibleFilter: false},
                {key: 'kabir', name: 'Kabir Khan', issues: ['ONE-1', 'ONE-4'], visibleFilter: true},
                {key: NONE_FILTER, name: 'None', issues: ['ONE-2', 'ONE-5'], visibleFilter: true}])
              .checkBoard(board);
            new EqualityChecker()
              .cleanSwimlanes('bob', 'kabir')
              .cleanSwimlaneTables(NONE_FILTER)
              .check(originalView, board);
          });
        });
        it('Components', () => {
          util = createUtilWithStandardIssues({swimlane: 'component', 'component': NONE_FILTER});
          util.observer().take(1).subscribe(
            board => {
              new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3'], ['ONE-4', 'ONE-5'], []])
                .invisibleIssues(['ONE-1', 'ONE-2', 'ONE-3', 'ONE-4'])
                .swimlanes([
                  {key: 'C-10', name: 'C-10', issues: ['ONE-1', 'ONE-4'], visibleFilter: false},
                  {key: 'C-20', name: 'C-20', issues: ['ONE-2', 'ONE-4'], visibleFilter: false},
                  {key: 'C-30', name: 'C-30', issues: ['ONE-3', 'ONE-4'], visibleFilter: false},
                  {key: NONE_FILTER, name: 'None', issues: ['ONE-5'], visibleFilter: true}])
                .checkBoard(board);
              originalView = board;
            });
          util.getUserSettingUpdater().updateFilters('component', 'C-10', 'C-20')
            .observer().take(1).subscribe(board => {
            new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3'], ['ONE-4', 'ONE-5'], []])
              .invisibleIssues(['ONE-3', 'ONE-5'])
              .swimlanes([
                {key: 'C-10', name: 'C-10', issues: ['ONE-1', 'ONE-4'], visibleFilter: true},
                {key: 'C-20', name: 'C-20', issues: ['ONE-2', 'ONE-4'], visibleFilter: true},
                {key: 'C-30', name: 'C-30', issues: ['ONE-3', 'ONE-4'], visibleFilter: false},
                {key: NONE_FILTER, name: 'None', issues: ['ONE-5'], visibleFilter: false}])
              .checkBoard(board);
            new EqualityChecker()
              .cleanSwimlaneTables('C-10', 'C-20', 'C-30', NONE_FILTER)
              .check(originalView, board);
          });
        });
        it('Fix Versions', () => {
          util = createUtilWithStandardIssues({swimlane: 'fix-version', 'fix-version': NONE_FILTER});
          util.observer().take(1).subscribe(
            board => {
              new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3'], ['ONE-4', 'ONE-5'], []])
                .invisibleIssues(['ONE-1', 'ONE-2', 'ONE-3', 'ONE-5'])
                .swimlanes([
                  {key: 'F-10', name: 'F-10', issues: ['ONE-1', 'ONE-2'], visibleFilter: false},
                  {key: 'F-20', name: 'F-20', issues: ['ONE-1', 'ONE-3'], visibleFilter: false},
                  {key: 'F-30', name: 'F-30', issues: ['ONE-1', 'ONE-5'], visibleFilter: false},
                  {key: NONE_FILTER, name: 'None', issues: ['ONE-4'], visibleFilter: true}])
                .checkBoard(board);
              originalView = board;
            });
          util.getUserSettingUpdater().updateFilters('fix-version', 'F-10')
            .observer().take(1).subscribe(board => {
            new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3'], ['ONE-4', 'ONE-5'], []])
              .invisibleIssues(['ONE-3', 'ONE-4', 'ONE-5'])
              .swimlanes([
                {key: 'F-10', name: 'F-10', issues: ['ONE-1', 'ONE-2'], visibleFilter: true},
                {key: 'F-20', name: 'F-20', issues: ['ONE-1', 'ONE-3'], visibleFilter: false},
                {key: 'F-30', name: 'F-30', issues: ['ONE-1', 'ONE-5'], visibleFilter: false},
                {key: NONE_FILTER, name: 'None', issues: ['ONE-4'], visibleFilter: false}])
              .checkBoard(board);
            new EqualityChecker()
              .cleanSwimlaneTables('F-10', 'F-20', 'F-30', NONE_FILTER)
              .check(originalView, board);
          });
        });
        it('Labels', () => {
          util = createUtilWithStandardIssues({swimlane: 'label', 'label': NONE_FILTER});
          util.observer().take(1).subscribe(
            board => {
              new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3'], ['ONE-4', 'ONE-5'], []])
                .invisibleIssues(['ONE-2', 'ONE-3', 'ONE-4', 'ONE-5'])
                .swimlanes([
                  {key: 'L-10', name: 'L-10', issues: ['ONE-2', 'ONE-3'], visibleFilter: false},
                  {key: 'L-20', name: 'L-20', issues: ['ONE-2', 'ONE-4'], visibleFilter: false},
                  {key: 'L-30', name: 'L-30', issues: ['ONE-2', 'ONE-5'], visibleFilter: false},
                  {key: NONE_FILTER, name: 'None', issues: ['ONE-1'], visibleFilter: true}])
                .checkBoard(board);
              originalView = board;
            });
          util.getUserSettingUpdater().updateFilters('label')
            .observer().take(1).subscribe(board => {
            new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3'], ['ONE-4', 'ONE-5'], []])
              .swimlanes([
                {key: 'L-10', name: 'L-10', issues: ['ONE-2', 'ONE-3'], visibleFilter: true},
                {key: 'L-20', name: 'L-20', issues: ['ONE-2', 'ONE-4'], visibleFilter: true},
                {key: 'L-30', name: 'L-30', issues: ['ONE-2', 'ONE-5'], visibleFilter: true},
                {key: NONE_FILTER, name: 'None', issues: ['ONE-1'], visibleFilter: true}])
              .checkBoard(board);
            new EqualityChecker()
              .cleanSwimlanes(NONE_FILTER)
              .cleanSwimlaneTables('L-10', 'L-20', 'L-30')
              .check(originalView, board);
          });
        });
        it('Custom Field', () => {
          util = createUtilWithStandardIssues({swimlane: 'Custom-2', 'cf.Custom-2': 'c2-A'});
          util.observer().take(1).subscribe(
            board => {
              new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3'], ['ONE-4', 'ONE-5'], []])
                .invisibleIssues(['ONE-4', 'ONE-5'])
                .swimlanes([
                  {key: 'c2-A', name: 'First C2', issues: ['ONE-1', 'ONE-2', 'ONE-3'], visibleFilter: true},
                  {key: 'c2-B', name: 'Second C2', issues: ['ONE-4'], visibleFilter: false},
                  {key: NONE_FILTER, name: 'None', issues: ['ONE-5'], visibleFilter: false}])
                .checkBoard(board);
              originalView = board;
            });
          util.getUserSettingUpdater().updateFilters('Custom-2', 'c2-B')
            .observer().take(1).subscribe(board => {
            new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3'], ['ONE-4', 'ONE-5'], []])
              .invisibleIssues(['ONE-1', 'ONE-2', 'ONE-3', 'ONE-5'])
              .swimlanes([
                {key: 'c2-A', name: 'First C2', issues: ['ONE-1', 'ONE-2', 'ONE-3'], visibleFilter: false},
                {key: 'c2-B', name: 'Second C2', issues: ['ONE-4'], visibleFilter: true},
                {key: NONE_FILTER, name: 'None', issues: ['ONE-5'], visibleFilter: false}])
              .checkBoard(board);
            new EqualityChecker()
              .cleanSwimlanes(NONE_FILTER)
              .cleanSwimlaneTables('c2-A', 'c2-B')
              .check(originalView, board);
          });
        });
      });

      describe('Swimlane and non-swimlane filters', () => {

        // We have tested everything else pretty extensively, so don't test all combinations here

        it('Update non-swimlane filter', () => {
          util =
            createUtilWithStandardIssues({swimlane: 'assignee', 'assignee': 'kabir', 'issue-type': 'task'});
          util.observer().take(1).subscribe(
            board => {
              new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3'], ['ONE-4', 'ONE-5'], []])
                .invisibleIssues(['ONE-1', 'ONE-2', 'ONE-3', 'ONE-5'])
                .swimlanes([
                  {key: 'bob', name: 'Bob Brent Barlow', issues: ['ONE-3'], visibleFilter: false},
                  {key: 'kabir', name: 'Kabir Khan', issues: ['ONE-1', 'ONE-4'], visibleFilter: true},
                  {key: NONE_FILTER, name: 'None', issues: ['ONE-2', 'ONE-5'], visibleFilter: false}])
                .checkBoard(board);
              originalView = board;
            });
          util.getUserSettingUpdater().updateFilters('issue-type');
          util.getUserSettingUpdater().updateFilters('priority', 'Blocker')
            .observer().take(1).subscribe(
            board => {
              new BoardChecker([['ONE-1', 'ONE-2', 'ONE-3'], ['ONE-4', 'ONE-5'], []])
                .invisibleIssues(['ONE-2', 'ONE-3', 'ONE-4', 'ONE-5'])
                .swimlanes([
                  {key: 'bob', name: 'Bob Brent Barlow', issues: ['ONE-3'], visibleFilter: false},
                  {key: 'kabir', name: 'Kabir Khan', issues: ['ONE-1', 'ONE-4'], visibleFilter: true},
                  {key: NONE_FILTER, name: 'None', issues: ['ONE-2', 'ONE-5'], visibleFilter: false}])
                .checkBoard(board);

              new EqualityChecker()
                .cleanSwimlanes('bob', NONE_FILTER, 'kabir')
                .check(originalView, board);
            });
        });
      });

      describe('Check toggle show empty swimlanes', () => {
        it ('Initially false', () => {
          // What we create here does not really matter, the main check is that the swimlane info 'showEmpty' field gets set
          util =
            createUtilWithStandardIssues({swimlane: 'assignee', 'assignee': 'kabir', 'issue-type': 'task'});
          util.observer().take(1).subscribe(
            board => {
              // We do tests elsewhere for the content of the board/swimlanes - let's just check the SwimlaneInfo showEmpty field
              expect(board.issueTable.swimlaneInfo).toBeTruthy();
              expect(board.issueTable.swimlaneInfo.showEmpty).toBe(false);
            });
          util.getUserSettingUpdater().toggleShowEmptySwimlanes()
            .observer().take(1).subscribe(
              board => {
                expect(board.issueTable.swimlaneInfo).toBeTruthy();
                expect(board.issueTable.swimlaneInfo.showEmpty).toBe(true);
              });

          // Do some extra checks here which are not needed in the other similar tests
          util.getUserSettingUpdater().updateSwimlane('project')
            .observer().take(1).subscribe(
            board => {
              expect(board.issueTable.swimlaneInfo).toBeTruthy();
              expect(board.issueTable.swimlaneInfo.showEmpty).toBe(false);
            });
          util.getUserSettingUpdater().toggleShowEmptySwimlanes()
            .observer().take(1).subscribe(
            board => {
              expect(board.issueTable.swimlaneInfo).toBeTruthy();
              expect(board.issueTable.swimlaneInfo.showEmpty).toBe(true);
            });
          util.getUserSettingUpdater().updateSwimlane(null)
            .observer().take(1).subscribe(
            board => {
              expect(board.issueTable.swimlaneInfo).toBeFalsy();
            });
        });

        it ('Initially true', () => {
          // What we create here does not really matter, the main check is that the swimlane info 'showEmpty' field gets set
          util =
            createUtilWithStandardIssues({showEmptySl: 'true', swimlane: 'assignee', 'assignee': 'kabir', 'issue-type': 'task'});
          util.observer().take(1).subscribe(
            board => {
              // We do tests elsewhere for the content of the board/swimlanes - let's just check the SwimlaneInfo showEmpty field
              expect(board.issueTable.swimlaneInfo).toBeTruthy();
              expect(board.issueTable.swimlaneInfo.showEmpty).toBe(true);
            });
          util.getUserSettingUpdater().toggleShowEmptySwimlanes()
            .observer().take(1).subscribe(
            board => {
              expect(board.issueTable.swimlaneInfo).toBeTruthy();
              expect(board.issueTable.swimlaneInfo.showEmpty).toBe(false);
            });

        });
      });
    });

  });


  function createUtilWithStandardIssues(params: Dictionary<string>): BoardViewObservableUtil {
    return createUtil(params, {'ONE': [1, 2, 3, 4, 5]},
      new SwimlaneIssueFactory()
        .addIssue('ONE-1', 0,
          {components: [0], 'fix-versions': [0, 1, 2], custom: {'Custom-2': 0}})
        .addIssue('ONE-2', 0,
          {components: [1], 'fix-versions': [0], labels: [0, 1, 2], custom: {'Custom-2': 0}})
        .addIssue('ONE-3', 0,
          {components: [2], 'fix-versions': [1], labels: [0], custom: {'Custom-2': 0}})
        .addIssue('ONE-4', 1, {components: [0, 1, 2], labels: [1], custom: {'Custom-2': 1}})
        .addIssue('ONE-5', 1, {'fix-versions': [2], labels: [2]})
    );
  }

  function createUtil(params: Dictionary<string>, ranks: Dictionary<number[]>,
                      issueFactory: SwimlaneIssueFactory): BoardViewObservableUtil {
    const init: BoardStateInitializer =
      new BoardStateInitializer('ONE')
        .headerStateFactory(new NumberedHeaderStateFactory(3))
        .issuesFactory(issueFactory)
        .mapState('ONE', 'S-1', '1-1')
        .mapState('ONE', 'S-2', '1-2')
        .mapState('ONE', 'S-3', '1-3')
        .mapState('TWO', 'S-2', '2-1')
        .mapState('TWO', 'S-3', '2-2');
    for (const key of Object.keys(ranks)) {
      init.setRank(key, ...ranks[key]);
    }
    const util: BoardViewObservableUtil = new BoardViewObservableUtil(params)
      .initializeBoardState(init);
    return util;
  }
});

class BoardChecker {
  private _expectedInvisible: string[] = [];
  private _expectedSwimlanes: SwimlaneCheck[];
  private _expectedShowEmptySwimlanes: boolean;

  constructor(private _expectedTable: string[][]) {
  }

  invisibleIssues(invisible: string[]): BoardChecker {
    this._expectedInvisible = invisible;
    return this;
  }

  swimlanes(swimlanes: SwimlaneCheck[], showEmpty: boolean = false): BoardChecker {
    this._expectedSwimlanes = swimlanes;
    this._expectedShowEmptySwimlanes = showEmpty;
    return this;
  }

  checkBoard(board: BoardViewModel) {
    const issueTable: IssueTable = board.issueTable;

    const actualTable: string[][] = [];
    issueTable.table.forEach((v, i) => {
      actualTable.push(issueTable.table.get(i).toArray());
    });
    expect(actualTable).toEqual(this._expectedTable);

    // Check the size of the issues map
    expect(issueTable.issues.size).toBe(this._expectedTable.map(issues => issues.length).reduce((s, c) => s + c));

    // Check issue visibilities
    const invisibleKeys: string[] =
      issueTable.issues.filter(issue => !issue.visible).keySeq().toArray().sort((a, b) => a.localeCompare(b));
    expect(invisibleKeys).toEqual(this._expectedInvisible.sort((a, b) => a.localeCompare(b)));

    // Check issue counts
    const invisibleIssueSet: Set<string> = Set<string>(this._expectedInvisible);
    const totalIssueCounts: number[] = new Array<number>(this._expectedTable.length);
    const visibleIssueCounts: number[] = new Array<number>(this._expectedTable.length);
    for (let i = 0 ; i < this._expectedTable.length ; i++) {
      visibleIssueCounts[i] = this._expectedTable[i].reduce((s, v, ind, arr) => {
        return invisibleIssueSet.contains(arr[ind]) ? s : s + 1;
      }, 0);
      totalIssueCounts[i] = this._expectedTable[i].length;
    }

    // Check header counts
    board.headers.headersList.forEach(header => this.checkHeader(header, totalIssueCounts, visibleIssueCounts));


    if (!this._expectedSwimlanes) {
      expect(issueTable.swimlaneInfo).toBeFalsy();
    } else {
      expect(issueTable.swimlaneInfo).toBeTruthy();
      this.checkSwimlanes(issueTable);
    }
  }

  private checkSwimlanes(issueTable: IssueTable) {
    const slInfo: SwimlaneInfo = issueTable.swimlaneInfo;
    expect(slInfo.showEmpty).toBe(this._expectedShowEmptySwimlanes);

    // Check the names and keys are as expected
    expect(slInfo.swimlanes.size).toBe(this._expectedSwimlanes.length);
    expect(slInfo.swimlanes.keySeq().toArray()).toEqual(this._expectedSwimlanes.map(sl => sl.key));
    expect(slInfo.swimlanes.map(sd => sd.display).toArray()).toEqual(this._expectedSwimlanes.map(sl => sl.name));

    for (const check of this._expectedSwimlanes) {
      const checkIssueSet: Set<string> = Set<string>(check.issues);
      const sl: SwimlaneData = slInfo.swimlanes.get(check.key);

      const expectedTable: string[][] = [];
      issueTable.table.forEach((v, i) => {
        expectedTable.push(issueTable.table.get(i).toArray().filter(key =>  checkIssueSet.contains(key)));
      });
      const actualTable: string[][] = [];
      sl.table.forEach((v, i) => {
        actualTable.push(sl.table.get(i).toArray());
      });
      expect(actualTable).toEqual(expectedTable);
      expect(sl.visibleIssues).toBe(check.issues.reduce((s, key) => issueTable.issues.get(key).visible ? s + 1 : s, 0));

      // Undefined means true
      const expectedVisible: boolean = !(check.visibleFilter === false);
      expect(sl.filterVisible).toBe(expectedVisible);
    }
  }

  private checkHeader(header: BoardHeader, totalIssueCounts: number[], visibleIssueCounts: number[]) {
    if (header.category) {
      let total: number;
      let visible: number;
      header.states.forEach((h, i) => {
        this.checkHeader(header, totalIssueCounts, visibleIssueCounts);
        const stateIndex = header.stateIndices.get(0);
        total += header.totalIssues;
        visible += header.visibleIssues;
      });
    } else {
      const stateIndex = header.stateIndices.get(0);
      expect(header.totalIssues).toBe(totalIssueCounts[stateIndex]);
      expect(header.visibleIssues).toBe(visibleIssueCounts[stateIndex]);
    }
  }
}

interface SwimlaneCheck {
  key: string;
  name: string;
  issues: string[];
  /* If not set true is assumed */
  visibleFilter?: boolean;
}

class EqualityChecker {
  private _unchangedSwimlanes: string[];
  private _unchangedSwimlaneTables: string[];
  private _changedSwimlaneColumns: Dictionary<number[]> = {};

  cleanSwimlanes(...unchangedSwimlanes: string[]): EqualityChecker {
    this._unchangedSwimlanes = unchangedSwimlanes;
    return this;
  }

  cleanSwimlaneTables(...unchangedSwimlaneTables: string[]): EqualityChecker {
    this._unchangedSwimlaneTables = unchangedSwimlaneTables;
    return this;
  }

  addChangedSwimlaneColumns(key: string, ...changedColumns: number[]): EqualityChecker {
    this._changedSwimlaneColumns[key] = changedColumns;
    return this;
  }

  check(oldBoard: BoardViewModel, newBoard: BoardViewModel) {
    const old: SwimlaneInfo = oldBoard.issueTable.swimlaneInfo;
    const curr: SwimlaneInfo = newBoard.issueTable.swimlaneInfo;
    const unchangedSwimlanes: Set<string> =
      this._unchangedSwimlanes ? Set<string>(this._unchangedSwimlanes) : Set<string>();
    const unchangedSwimlaneTables: Set<string> =
      this._unchangedSwimlaneTables ? Set<string>(this._unchangedSwimlaneTables) : Set<string>();
    const changedSwimlaneColumns: Map<string, List<number>> = Map<string, List<number>>(this._changedSwimlaneColumns);
    // Do some validation of user errors
    unchangedSwimlanes.forEach(v => {
      if (changedSwimlaneColumns.has(v)) {
        fail(`'${v}' appears in both clean swimlanes and where we are expecting a change`);
      }
      if (unchangedSwimlaneTables.has(v)) {
        fail(`'${v}' appears in both clean swimlanes and clean tables`);
      }
    });
    unchangedSwimlaneTables.forEach(v => {
      if (changedSwimlaneColumns.has(v)) {
        fail(`'${v}' appears in both clean swimlane tables and where we are expecting a change`);
      }
      if (unchangedSwimlanes.has(v)) {
        fail(`'${v}' appears in both clean swimlanes and clean tables`);
      }
    });
    const allKeys: Set<string> =
      Set<string>().intersect(unchangedSwimlanes, unchangedSwimlaneTables, changedSwimlaneColumns.keySeq());
    const missingChecks: Set<string> =
      Set<string>().subtract(curr.swimlanes.keySeq(), allKeys);
    if (missingChecks.size > 0) {
      fail(`The swimlane contains values ${missingChecks.toArray()}, for which there are no checks configured`);
    }

    unchangedSwimlanes.forEach(k => {
      expect(curr.swimlanes.get(k)).toBeTruthy();
      expect(curr.swimlanes.get(k)).toBe(old.swimlanes.get(k), `Different swimlane: ${k}`);
    });
    unchangedSwimlaneTables.forEach(k => {
      expect(curr.swimlanes.get(k)).toBeTruthy();
      expect(curr.swimlanes.get(k).table).toBe(old.swimlanes.get(k).table, `Different swimlane table: ${k}`);
      expect(curr.swimlanes.get(k)).not.toBe(old.swimlanes.get(k), `Same swimlane: ${k}`);
    });
    changedSwimlaneColumns.forEach((changedColumns, k) => {
      expect(curr.swimlanes.get(k)).toBeTruthy();
      const oldSlTable: List<List<string>> = old.swimlanes.get(k) ? old.swimlanes.get(k).table : null;
      const newTable: List<List<string>> = curr.swimlanes.get(k).table;
      const expectedChanged: Set<number> = Set<number>(changedColumns);
      for (let i = 0 ; i < newTable.size ; i++) {
        const oldCol: List<string> = oldSlTable ? oldSlTable.get(i) : null;
        const newCol: List<string> = newTable.get(i);
        if (expectedChanged.contains(i)) {
          expect(oldCol).not.toBe(newCol, `Column ${i} of ${k} should not have been the same`);
        } else {
          expect(oldCol).toBe(newCol, `Column ${i} of ${k} should have been the same`);
        }

      }
    });
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

class SwimlaneIssueFactory implements IssuesFactory {
  _issues: Dictionary<any>;

  clear() {
    this._issues = null;
  }

  addIssue(key: string, state: number, data?: any): SwimlaneIssueFactory {
    if (!this._issues) {
      this._issues = {};
    }
    this._issues[key] = !data ? {} : data;
    this._issues[key]['state'] = state;
    return this;
  }

  createIssueStateInput(params: DeserializeIssueLookupParams): any {
    const input: any = {};
    for (const key of Object.keys(this._issues)) {
      const id = Number(key.substr(key.indexOf('-') + 1));
      const assignee: number = id % 3 === 2 ? null : id % 3;
      const isssue = {
        key: key,
        type: id % 2,
        priority: (id + 1) % 2,
        assignee: assignee
      };

      const data: any = this._issues[key];
      for (const override of Object.keys(data)) {
        isssue[override] = data[override]
      }

      input[key] = isssue;
    }

    return input;
  }
}
