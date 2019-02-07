import {BoardStateInitializer, BoardViewObservableUtil, HeaderStateFactory, IssuesFactory} from './board-view.common.spec';
import {HeaderState} from '../../model/board/data/header/header.state';
import {HeaderActions, headerMetaReducer} from '../../model/board/data/header/header.reducer';
import {DeserializeIssueLookupParams} from '../../model/board/data/issue/issue.model';
import {List} from 'immutable';
import {BoardHeaders} from './board-headers';
import {Dictionary} from '../../common/dictionary';
import {BoardHeader} from './board-header';
import {map, take} from 'rxjs/operators';

describe('Board headers tests', () => {
  let util: BoardViewObservableUtil;
  beforeEach(() => {
    util = new BoardViewObservableUtil();
  });
  describe('Layout Tests', () => {
    describe('No categories', () => {
      let initializer: BoardStateInitializer;
      let states: any[];
      beforeEach(() => {
        initializer = new BoardStateInitializer()
          .issuesFactory(new EmptyIssuesFactory());
        states = [
          {name: 'S1'},
          {name: 'S2'},
          {name: 'S3'},
          {name: 'S4'},
          {name: 'S5'}];
      });
      describe('No wip', () => {
        it('Simple', () => {
          util
            .updateBoardState(initializer.headerStateFactory(createHeaderStateFactory(states, 0, 0)))
            .easySubscribeHeaders(headers => {
              check(headers.headersList,
                new HeaderChecker('S1').stateIndices(0),
                new HeaderChecker('S2').stateIndices(1),
                new HeaderChecker('S3').stateIndices(2),
                new HeaderChecker('S4').stateIndices(3),
                new HeaderChecker('S5').stateIndices(4));
            });
        });
        it('Backlog and done', () => {
          util
            .updateBoardState(initializer.headerStateFactory(createHeaderStateFactory(states, 2, 1)))
            .easySubscribeHeaders(headers => {
              check(headers.headersList,
                new HeaderChecker('Backlog').stateIndices(0, 1).backlog().invisible()
                  .states(
                    new HeaderChecker('S1').stateIndices(0).backlog().invisible(),
                    new HeaderChecker('S2').stateIndices(1).backlog().invisible()
                  ),
                new HeaderChecker('S3').stateIndices(2),
                new HeaderChecker('S4').stateIndices(3));
            });
        });
      });

      describe('Wip', () => {
        it('Some wip', () => {
          states[1]['wip'] = 4;
          initializer = new BoardStateInitializer()
            .issuesFactory(new EmptyIssuesFactory())
            .headerStateFactory(createHeaderStateFactory(states, 1, 0));
          util
            .updateBoardState(initializer)
            .easySubscribeHeaders(headers => {
              check(headers.headersList,
                new HeaderChecker('Backlog').stateIndices(0).backlog().invisible()
                  .states(
                    new HeaderChecker('S1').stateIndices(0).backlog().invisible()
                  ),
                new HeaderChecker('S2').stateIndices(1).wip(4),
                new HeaderChecker('S3').stateIndices(2),
                new HeaderChecker('S4').stateIndices(3),
                new HeaderChecker('S5').stateIndices(4));
            });
        });
        it('All wip', () => {
          states[1]['wip'] = 4;
          states[2]['wip'] = 11;
          states[3]['wip'] = 9;
          states[4]['wip'] = 23;
          initializer = new BoardStateInitializer()
            .issuesFactory(new EmptyIssuesFactory())
            .headerStateFactory(createHeaderStateFactory(states, 1, 0));
          util
            .updateBoardState(initializer)
            .easySubscribeHeaders(headers => {
              check(headers.headersList,
                new HeaderChecker('Backlog').stateIndices(0).backlog().invisible()
                  .states(
                    new HeaderChecker('S1').stateIndices(0).backlog().invisible()
                  ),
                new HeaderChecker('S2').stateIndices(1).wip(4),
                new HeaderChecker('S3').stateIndices(2).wip(11),
                new HeaderChecker('S4').stateIndices(3).wip(9),
                new HeaderChecker('S5').stateIndices(4).wip(23));
            });
        });
      });

      function createHeaderStateFactory(statesInput: any[], backlog: number, done: number): HeaderStateFactory {
        return new TestHeaderStateFactory(statesInput, [], backlog, done);
      }
    });

    describe('Categories', () => {
      let initializer: BoardStateInitializer;
      let states: any[];
      beforeEach(() => {
        initializer = new BoardStateInitializer()
          .issuesFactory(new EmptyIssuesFactory());
        states = [
          {name: 'S1'},
          {name: 'S2'},
          {name: 'S3'},
          {name: 'S4'},
          {name: 'S5'}];
      });
      describe('No backlog', () => {
        it('Header one state, start', () => {
          states[0]['header'] = 0;
          initializer = new BoardStateInitializer()
            .issuesFactory(new EmptyIssuesFactory())
            .headerStateFactory(new TestHeaderStateFactory(states, ['H1'], 0, 0));
          util
            .updateBoardState(initializer)
            .easySubscribeHeaders(headers => {
              check(headers.headersList,
                new HeaderChecker('H1').stateIndices(0)
                  .states(
                    new HeaderChecker('S1').stateIndices(0)
                  ),
                new HeaderChecker('S2').stateIndices(1),
                new HeaderChecker('S3').stateIndices(2),
                new HeaderChecker('S4').stateIndices(3),
                new HeaderChecker('S5').stateIndices(4));
            });
        });
        it('Header two states, start', () => {
          states[0]['header'] = 0;
          states[1]['header'] = 0;
          initializer = new BoardStateInitializer()
            .issuesFactory(new EmptyIssuesFactory())
            .headerStateFactory(new TestHeaderStateFactory(states, ['H1'], 0, 0));
          util
            .updateBoardState(initializer)
            .easySubscribeHeaders(headers => {
              check(headers.headersList,
                new HeaderChecker('H1').stateIndices(0, 1)
                  .states(
                    new HeaderChecker('S1').stateIndices(0),
                    new HeaderChecker('S2').stateIndices(1)
                  ),
                new HeaderChecker('S3').stateIndices(2),
                new HeaderChecker('S4').stateIndices(3),
                new HeaderChecker('S5').stateIndices(4));
            });
        });
        it('Header one state, middle', () => {
          states[2]['header'] = 0;
          initializer = new BoardStateInitializer()
            .issuesFactory(new EmptyIssuesFactory())
            .headerStateFactory(new TestHeaderStateFactory(states, ['H1'], 0, 0));
          util
            .updateBoardState(initializer)
            .easySubscribeHeaders(headers => {
              check(headers.headersList,
                new HeaderChecker('S1').stateIndices(0),
                new HeaderChecker('S2').stateIndices(1),
                new HeaderChecker('H1').stateIndices(2)
                  .states(
                    new HeaderChecker('S3').stateIndices(2)
                  ),
                new HeaderChecker('S4').stateIndices(3),
                new HeaderChecker('S5').stateIndices(4));
            });
        });
        it('Header two states, middle', () => {
          states[2]['header'] = 0;
          states[3]['header'] = 0;
          initializer = new BoardStateInitializer()
            .issuesFactory(new EmptyIssuesFactory())
            .headerStateFactory(new TestHeaderStateFactory(states, ['H1'], 0, 0));
          util
            .updateBoardState(initializer)
            .easySubscribeHeaders(headers => {
              check(headers.headersList,
                new HeaderChecker('S1').stateIndices(0),
                new HeaderChecker('S2').stateIndices(1),
                new HeaderChecker('H1').stateIndices(2, 3)
                  .states(
                    new HeaderChecker('S3').stateIndices(2),
                    new HeaderChecker('S4').stateIndices(3)
                  ),
                new HeaderChecker('S5').stateIndices(4));
            });
        });
        it('Header one state, end', () => {
          states[4]['header'] = 0;
          initializer = new BoardStateInitializer()
            .issuesFactory(new EmptyIssuesFactory())
            .headerStateFactory(new TestHeaderStateFactory(states, ['H1'], 0, 0));
          util
            .updateBoardState(initializer)
            .easySubscribeHeaders(headers => {
              check(headers.headersList,
                new HeaderChecker('S1').stateIndices(0),
                new HeaderChecker('S2').stateIndices(1),
                new HeaderChecker('S3').stateIndices(2),
                new HeaderChecker('S4').stateIndices(3),
                new HeaderChecker('H1').stateIndices(4)
                  .states(
                    new HeaderChecker('S5').stateIndices(4)
                  )
              );
            });
        });
        it('Header one state, end', () => {
          states[3]['header'] = 0;
          states[4]['header'] = 0;
          initializer = new BoardStateInitializer()
            .issuesFactory(new EmptyIssuesFactory())
            .headerStateFactory(new TestHeaderStateFactory(states, ['H1'], 0, 0));
          util
            .updateBoardState(initializer)
            .easySubscribeHeaders(headers => {
              check(headers.headersList,
                new HeaderChecker('S1').stateIndices(0),
                new HeaderChecker('S2').stateIndices(1),
                new HeaderChecker('S3').stateIndices(2),
                new HeaderChecker('H1').stateIndices(3, 4)
                  .states(
                    new HeaderChecker('S4').stateIndices(3),
                    new HeaderChecker('S5').stateIndices(4)
                  )
              );
            });
        });
        it('Headers start and end, wip', () => {
          states[0]['header'] = 0;
          states[0]['wip'] = 3;
          states[1]['header'] = 0;
          states[1]['wip'] = 5;
          states[2]['wip'] = 13;
          states[3]['header'] = 1;
          states[3]['wip'] = 7;
          states[4]['header'] = 1;
          states[4]['wip'] = 11;

          initializer = new BoardStateInitializer()
            .issuesFactory(new EmptyIssuesFactory())
            .headerStateFactory(new TestHeaderStateFactory(states, ['H1', 'H2'], 0, 0));
          util
            .updateBoardState(initializer)
            .easySubscribeHeaders(headers => {
              check(headers.headersList,
                new HeaderChecker('H1').stateIndices(0, 1).wip(8)
                  .states(
                    new HeaderChecker('S1').stateIndices(0).wip(3),
                    new HeaderChecker('S2').stateIndices(1).wip(5)),
                new HeaderChecker('S3').stateIndices(2).wip(13),
                new HeaderChecker('H2').stateIndices(3, 4).wip(18)
                  .states(
                    new HeaderChecker('S4').stateIndices(3).wip(7),
                    new HeaderChecker('S5').stateIndices(4).wip(11))
              );
            });
        });
        it('Headers all states, wip', () => {
          states[0]['header'] = 0;
          states[0]['wip'] = 3;
          states[1]['header'] = 0;
          states[1]['wip'] = 5;
          states[2]['header'] = 0;
          states[2]['wip'] = 13;
          states[3]['header'] = 1;
          states[3]['wip'] = 7;
          states[4]['header'] = 1;
          states[4]['wip'] = 11;

          initializer = new BoardStateInitializer()
            .issuesFactory(new EmptyIssuesFactory())
            .headerStateFactory(new TestHeaderStateFactory(states, ['H1', 'H2'], 0, 0));
          util
            .updateBoardState(initializer)
            .easySubscribeHeaders(headers => {
              check(headers.headersList,
                new HeaderChecker('H1').stateIndices(0, 1, 2).wip(21)
                  .states(
                    new HeaderChecker('S1').stateIndices(0).wip(3),
                    new HeaderChecker('S2').stateIndices(1).wip(5),
                    new HeaderChecker('S3').stateIndices(2).wip(13)),
                new HeaderChecker('H2').stateIndices(3, 4).wip(18)
                  .states(
                    new HeaderChecker('S4').stateIndices(3).wip(7),
                    new HeaderChecker('S5').stateIndices(4).wip(11))
              );
            });
        });
      });

      describe('Backlog', () => {
        // We don't have to test the combinations of headers and no headers as aggressively here since we do a good job above
        beforeEach(() => {
          states = [
            // No wip or headers for the backlog states
            {name: 'B1'},
            {name: 'B2'},
            {name: 'S1', header: 0, wip: 3},
            {name: 'S2', header: 0, wip: 5},
            {name: 'S3', wip: 13},
            {name: 'S4', header: 1, wip: 7},
            {name: 'S5', header: 1, wip: 11}];
        });
        it('Some headers, wip', () => {
          initializer = new BoardStateInitializer()
            .issuesFactory(new EmptyIssuesFactory())
            .headerStateFactory(new TestHeaderStateFactory(states, ['H1', 'H2'], 2, 0));
          util
            .updateBoardState(initializer)
            .easySubscribeHeaders(headers => {
              check(headers.headersList,
                new HeaderChecker('Backlog').stateIndices(0, 1).backlog().invisible()
                  .states(
                    new HeaderChecker('B1').stateIndices(0).backlog().invisible(),
                    new HeaderChecker('B2').stateIndices(1).backlog().invisible()),
                new HeaderChecker('H1').stateIndices(2, 3).wip(8)
                  .states(
                    new HeaderChecker('S1').stateIndices(2).wip(3),
                    new HeaderChecker('S2').stateIndices(3).wip(5)),
                new HeaderChecker('S3').stateIndices(4).wip(13),
                new HeaderChecker('H2').stateIndices(5, 6).wip(18)
                  .states(
                    new HeaderChecker('S4').stateIndices(5).wip(7),
                    new HeaderChecker('S5').stateIndices(6).wip(11)));
            });
        });

        it('Deserialize same if no change to headers', () => {
          initializer = new BoardStateInitializer()
            .issuesFactory(new EmptyIssuesFactory())
            .headerStateFactory(new TestHeaderStateFactory(states, ['H1', 'H2'], 2, 0));
          let original: BoardHeaders;
          util
            .updateBoardState(initializer)
            .easySubscribeHeaders(headers => {
              original = headers;
            });
          util
            .updateBoardState(initializer)
            .easySubscribeHeaders(headers => {
              expect(headers).toBe(headers);
            });
        });
      });
    });
  });

  describe('Abbreviations', () => {
    it('Abbreviations', () => {
      const states: any = [
        // No wip or headers for the backlog states
        {name: 'Backlog'},
        {name: 'Analysis', header: 0},
        {name: 'Dev In Progress', header: 1},
        {name: 'More Work is needed', header: 1}];
      const initializer: BoardStateInitializer = new BoardStateInitializer()
        .issuesFactory(new EmptyIssuesFactory())
        .headerStateFactory(new TestHeaderStateFactory(states, ['Short Header', 'A much longer header'], 1, 0));
      util
        .updateBoardState(initializer)
        .easySubscribeHeaders(headers => {
          check(headers.headersList,
            new HeaderChecker('Backlog').abbreviated('B').stateIndices(0).backlog().invisible()
              .states(
                new HeaderChecker('Backlog').abbreviated('B').stateIndices(0).backlog().invisible()
              ),
            new HeaderChecker('Short Header').abbreviated('SH').stateIndices(1)
              .states(
                new HeaderChecker('Analysis').abbreviated('A').stateIndices(1)),
            new HeaderChecker('A much longer header').abbreviated('AML').stateIndices(2, 3)
              .states(
                new HeaderChecker('Dev In Progress').abbreviated('DIP').stateIndices(2),
                new HeaderChecker('More Work is needed').abbreviated('MWI').stateIndices(3)));
        });
    });
  });

  describe('Issue counts', () => {
    describe('No categories', () => {
      let original: BoardHeaders;
      beforeEach(() => {
        util =
          setUpBoard(
            new TestHeaderStateFactory([
              {name: 'S1'},
              {name: 'S2'},
              {name: 'S3'},
              {name: 'S4'}], []),
            {priority: 'Major'});
        // Layout is ['ONE-1', 'ONE-2'], ['ONE-3', 'ONE-4', 'ONE-5'], ['ONE-6', 'ONE-7', 'ONE-8', 'ONE-9'], []] odd=Blocker, even=Major
        util.easySubscribeHeaders(headers => {
          check(headers.headersList,
            new HeaderChecker('S1').stateIndices(0).counts(1, 2),
            new HeaderChecker('S2').stateIndices(1).counts(2, 3),
            new HeaderChecker('S3').stateIndices(2).counts(2, 4),
            new HeaderChecker('S4').stateIndices(3).counts(0, 0));
          original = headers;
        });
      });
      it('Update visible issues', () => {
        util.getUserSettingUpdater().updateFilters('priority', 'Blocker');
        util.easySubscribeHeaders(headers => {
          checkAndCompare(headers.headersList, original,
            new HeaderChecker('S1').stateIndices(0).counts(1, 2).same(),
            new HeaderChecker('S2').stateIndices(1).counts(1, 3),
            new HeaderChecker('S3').stateIndices(2).counts(2, 4).same(),
            new HeaderChecker('S4').stateIndices(3).counts(0, 0).same());
        });
      });

      it('Update total issues', () => {
        util.getBoardStateUpdater()
          .issueChanges({
            new: [
              {key: 'ONE-10', state: '1-4', summary: 'Test', priority: 'Blocker', type: 'task'},
              {key: 'ONE-11', state: '1-4', summary: 'Test', priority: 'Major', type: 'task'}]
          })
          .rankChanges({ONE: [{index: 9, key: 'ONE-10'}, {index: 10, key: 'ONE-11'}]})
          .emit();
        util.easySubscribeHeaders(headers => {
          checkAndCompare(headers.headersList, original,
            new HeaderChecker('S1').stateIndices(0).counts(1, 2).same(),
            new HeaderChecker('S2').stateIndices(1).counts(2, 3).same(),
            new HeaderChecker('S3').stateIndices(2).counts(2, 4).same(),
            new HeaderChecker('S4').stateIndices(3).counts(1, 2));
        });
      });
    });

    describe('Categories', () => {
      let original: BoardHeaders;
      beforeEach(() => {
        util =
          setUpBoard(
            new TestHeaderStateFactory([
              {name: 'S1', header: 0},
              {name: 'S2', header: 0},
              {name: 'S3', header: 1},
              {name: 'S4', header: 1}], ['H1', 'H2']),
            {priority: 'Major'});
        // Layout is ['ONE-1', 'ONE-2'], ['ONE-3', 'ONE-4', 'ONE-5'], ['ONE-6', 'ONE-7', 'ONE-8', 'ONE-9'], []] odd=Blocker, even=Major

        util.easySubscribeHeaders(headers => {
          check(headers.headersList,
            new HeaderChecker('H1').stateIndices(0, 1).counts(3, 5)
              .states(
                new HeaderChecker('S1').stateIndices(0).counts(1, 2),
                new HeaderChecker('S2').stateIndices(1).counts(2, 3)),
            new HeaderChecker('H2').stateIndices(2, 3).counts(2, 4)
              .states(
                new HeaderChecker('S3').stateIndices(2).counts(2, 4),
                new HeaderChecker('S4').stateIndices(3).counts(0, 0)));
          original = headers;
        });
      });

      it('Update visible issues', () => {
        util.getUserSettingUpdater().updateFilters('priority', 'Blocker');
        util.easySubscribeHeaders(headers => {
          checkAndCompare(headers.headersList, original,
            new HeaderChecker('H1').stateIndices(0, 1).counts(2, 5)
              .states(
                new HeaderChecker('S1').stateIndices(0).counts(1, 2).same(),
                new HeaderChecker('S2').stateIndices(1).counts(1, 3)),
            new HeaderChecker('H2').stateIndices(2, 3).counts(2, 4).same()
              .states(
                new HeaderChecker('S3').stateIndices(2).counts(2, 4).same(),
                new HeaderChecker('S4').stateIndices(3).counts(0, 0).same()));

        });
      });

      it('Update total issues', () => {
        util.getBoardStateUpdater()
          .issueChanges({
            new: [
              {key: 'ONE-10', state: '1-4', summary: 'Test', priority: 'Blocker', type: 'task'},
              {key: 'ONE-11', state: '1-4', summary: 'Test', priority: 'Major', type: 'task'}]
          })
          .rankChanges({ONE: [{index: 9, key: 'ONE-10'}, {index: 10, key: 'ONE-11'}]})
          .emit();
        util.easySubscribeHeaders(headers => {
          checkAndCompare(headers.headersList, original,
            new HeaderChecker('H1').stateIndices(0, 1).counts(3, 5).same()
              .states(
                new HeaderChecker('S1').stateIndices(0).counts(1, 2).same(),
                new HeaderChecker('S2').stateIndices(1).counts(2, 3).same()),
            new HeaderChecker('H2').stateIndices(2, 3).counts(3, 6)
              .states(
                new HeaderChecker('S3').stateIndices(2).counts(2, 4).same(),
                new HeaderChecker('S4').stateIndices(3).counts(1, 2)));
        });
      });
    });

    function setUpBoard(headerStateFactory: HeaderStateFactory, params?: Dictionary<string>): BoardViewObservableUtil {
      return new BoardViewObservableUtil(params)
        .updateBoardState(
          new BoardStateInitializer()
            .headerStateFactory(headerStateFactory)
            .setRank('ONE', 1, 2, 3, 4, 5, 6, 7, 8, 9)
            .mapState('ONE', 'S1', '1-1')
            .mapState('ONE', 'S2', '1-2')
            .mapState('ONE', 'S3', '1-3')
            .mapState('ONE', 'S4', '1-4')
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
                .addIssue('ONE-9', 2)
            ));
    }
  });


  describe('State visibility', () => {
    let original: BoardHeaders;
    describe('No visibilities set on load', () => {
      beforeEach(() => {
        util = new BoardViewObservableUtil()
          .updateBoardState(createInitialiser());
        util
          .easySubscribeHeaders(headers => {
            check(headers.headersList,
              new HeaderChecker('Backlog').stateIndices(0, 1).backlog().invisible()
                .states(
                  new HeaderChecker('B1').stateIndices(0).backlog().invisible(),
                  new HeaderChecker('B2').stateIndices(1).backlog().invisible()),
              new HeaderChecker('H1').stateIndices(2, 3)
                .states(
                  new HeaderChecker('S1').stateIndices(2),
                  new HeaderChecker('S2').stateIndices(3)),
              new HeaderChecker('S3').stateIndices(4),
              new HeaderChecker('H2').stateIndices(5, 6)
                .states(
                  new HeaderChecker('S4').stateIndices(5),
                  new HeaderChecker('S5').stateIndices(6)),
              new HeaderChecker('S6').stateIndices(7));
            original = headers;
          });
      });

      it('Toggle backlog', () => {
        // The toggle itself is a noop
        util.getUserSettingUpdater().toggleBacklog()
          .easySubscribeHeaders(headers => {
            expect(headers).toBe(original);
          });
        // The caller (BoardComponent) does a full refresh to load the board again
        util.updateBoardState(createInitialiser())
          .easySubscribeHeaders(headers => {
            expect(headers).not.toBe(original);
            checkAndCompare(headers.headersList, original,
              new HeaderChecker('Backlog').stateIndices(0, 1).backlog()
                .states(
                  new HeaderChecker('B1').stateIndices(0).backlog(),
                  new HeaderChecker('B2').stateIndices(1).backlog()),
              new HeaderChecker('H1').stateIndices(2, 3).same()
                .states(
                  new HeaderChecker('S1').stateIndices(2).same(),
                  new HeaderChecker('S2').stateIndices(3).same()),
              new HeaderChecker('S3').stateIndices(4).same(),
              new HeaderChecker('H2').stateIndices(5, 6).same()
                .states(
                  new HeaderChecker('S4').stateIndices(5).same(),
                  new HeaderChecker('S5').stateIndices(6).same()),
              new HeaderChecker('S6').stateIndices(7).same());
            original = headers;
          });

        // Toggle backlog states - DON'T TOGGLE all of them and assume that the backlog will be toggled
        // - that is handled by the header group component
        util.getUserSettingUpdater().updateVisibility(false, 0)
          .easySubscribeHeaders(headers => {
            checkAndCompare(headers.headersList, original,
              new HeaderChecker('Backlog').stateIndices(0, 1).backlog()
                .states(
                  new HeaderChecker('B1').stateIndices(0).backlog().invisible(),
                  new HeaderChecker('B2').stateIndices(1).backlog().same()),
              new HeaderChecker('H1').stateIndices(2, 3).same()
                .states(
                  new HeaderChecker('S1').stateIndices(2).same(),
                  new HeaderChecker('S2').stateIndices(3).same()),
              new HeaderChecker('S3').stateIndices(4).same(),
              new HeaderChecker('H2').stateIndices(5, 6).same()
                .states(
                  new HeaderChecker('S4').stateIndices(5).same(),
                  new HeaderChecker('S5').stateIndices(6).same()),
              new HeaderChecker('S6').stateIndices(7).same());
            original = headers;
          });

        util.getUserSettingUpdater().updateVisibility(true, 0)
          .easySubscribeHeaders(headers => {
            checkAndCompare(headers.headersList, original,
              new HeaderChecker('Backlog').stateIndices(0, 1).backlog()
                .states(
                  new HeaderChecker('B1').stateIndices(0).backlog(),
                  new HeaderChecker('B2').stateIndices(1).backlog().same()),
              new HeaderChecker('H1').stateIndices(2, 3).same()
                .states(
                  new HeaderChecker('S1').stateIndices(2).same(),
                  new HeaderChecker('S2').stateIndices(3).same()),
              new HeaderChecker('S3').stateIndices(4).same(),
              new HeaderChecker('H2').stateIndices(5, 6).same()
                .states(
                  new HeaderChecker('S4').stateIndices(5).same(),
                  new HeaderChecker('S5').stateIndices(6).same()),
              new HeaderChecker('S6').stateIndices(7).same());
            original = headers;
          });
      });

      it('Toggle single state visibility', () => {
        util.getUserSettingUpdater().updateVisibility(false, 4)
          .easySubscribeHeaders(headers => {
            checkAndCompare(headers.headersList, original,
              new HeaderChecker('Backlog').stateIndices(0, 1).backlog().invisible().same()
                .states(
                  new HeaderChecker('B1').stateIndices(0).backlog().invisible().same(),
                  new HeaderChecker('B2').stateIndices(1).backlog().invisible().same()),
              new HeaderChecker('H1').stateIndices(2, 3).same()
                .states(
                  new HeaderChecker('S1').stateIndices(2).same(),
                  new HeaderChecker('S2').stateIndices(3).same()),
              new HeaderChecker('S3').stateIndices(4).invisible(),
              new HeaderChecker('H2').stateIndices(5, 6).same()
                .states(
                  new HeaderChecker('S4').stateIndices(5).same(),
                  new HeaderChecker('S5').stateIndices(6).same()),
              new HeaderChecker('S6').stateIndices(7).same());
            original = headers;
          });

        util.getUserSettingUpdater().updateVisibility(true, 4)
          .easySubscribeHeaders(headers => {
            checkAndCompare(headers.headersList, original,
              new HeaderChecker('Backlog').stateIndices(0, 1).backlog().invisible().same()
                .states(
                  new HeaderChecker('B1').stateIndices(0).backlog().invisible().same(),
                  new HeaderChecker('B2').stateIndices(1).backlog().invisible().same()),
              new HeaderChecker('H1').stateIndices(2, 3).same()
                .states(
                  new HeaderChecker('S1').stateIndices(2).same(),
                  new HeaderChecker('S2').stateIndices(3).same()),
              new HeaderChecker('S3').stateIndices(4),
              new HeaderChecker('H2').stateIndices(5, 6).same()
                .states(
                  new HeaderChecker('S4').stateIndices(5).same(),
                  new HeaderChecker('S5').stateIndices(6).same()),
              new HeaderChecker('S6').stateIndices(7).same());
            original = headers;
          });
      });

      it('Toggle state in category visibilities', () => {
        // One category state invisible, category should still be visible
        util.getUserSettingUpdater().updateVisibility(false, 3)
          .easySubscribeHeaders(headers => {
            checkAndCompare(headers.headersList, original,
              new HeaderChecker('Backlog').stateIndices(0, 1).backlog().invisible().same()
                .states(
                  new HeaderChecker('B1').stateIndices(0).backlog().invisible().same(),
                  new HeaderChecker('B2').stateIndices(1).backlog().invisible().same()),
              new HeaderChecker('H1').stateIndices(2, 3)
                .states(
                  new HeaderChecker('S1').stateIndices(2).same(),
                  new HeaderChecker('S2').stateIndices(3).invisible()),
              new HeaderChecker('S3').stateIndices(4).same(),
              new HeaderChecker('H2').stateIndices(5, 6).same()
                .states(
                  new HeaderChecker('S4').stateIndices(5).same(),
                  new HeaderChecker('S5').stateIndices(6).same()),
              new HeaderChecker('S6').stateIndices(7).same());
            original = headers;
          });

        // All category states invisible, category should  be invisible too
        util.getUserSettingUpdater().updateVisibility(false, 2)
          .easySubscribeHeaders(headers => {
            checkAndCompare(headers.headersList, original,
              new HeaderChecker('Backlog').stateIndices(0, 1).backlog().invisible().same()
                .states(
                  new HeaderChecker('B1').stateIndices(0).backlog().invisible().same(),
                  new HeaderChecker('B2').stateIndices(1).backlog().invisible().same()),
              new HeaderChecker('H1').stateIndices(2, 3).invisible()
                .states(
                  new HeaderChecker('S1').stateIndices(2).invisible(),
                  new HeaderChecker('S2').stateIndices(3).invisible().same()),
              new HeaderChecker('S3').stateIndices(4).same(),
              new HeaderChecker('H2').stateIndices(5, 6).same()
                .states(
                  new HeaderChecker('S4').stateIndices(5).same(),
                  new HeaderChecker('S5').stateIndices(6).same()),
              new HeaderChecker('S6').stateIndices(7).same());
            original = headers;
          });

        // One category state invisible, category should still be visible
        util.getUserSettingUpdater().updateVisibility(true, 3)
          .easySubscribeHeaders(headers => {
            checkAndCompare(headers.headersList, original,
              new HeaderChecker('Backlog').stateIndices(0, 1).backlog().invisible().same()
                .states(
                  new HeaderChecker('B1').stateIndices(0).backlog().invisible().same(),
                  new HeaderChecker('B2').stateIndices(1).backlog().invisible().same()),
              new HeaderChecker('H1').stateIndices(2, 3)
                .states(
                  new HeaderChecker('S1').stateIndices(2).invisible().same(),
                  new HeaderChecker('S2').stateIndices(3)),
              new HeaderChecker('S3').stateIndices(4).same(),
              new HeaderChecker('H2').stateIndices(5, 6).same()
                .states(
                  new HeaderChecker('S4').stateIndices(5).same(),
                  new HeaderChecker('S5').stateIndices(6).same()),
              new HeaderChecker('S6').stateIndices(7).same());
            original = headers;
          });


        // Some extra checks here just to make sure, we don't need to repeat these everywhere else
        // All category states visible, category should  be visible too
        util.getUserSettingUpdater().updateVisibility(true, 2)
          .easySubscribeHeaders(headers => {
            checkAndCompare(headers.headersList, original,
              new HeaderChecker('Backlog').stateIndices(0, 1).backlog().invisible().same()
                .states(
                  new HeaderChecker('B1').stateIndices(0).backlog().invisible().same(),
                  new HeaderChecker('B2').stateIndices(1).backlog().invisible().same()),
              new HeaderChecker('H1').stateIndices(2, 3)
                .states(
                  new HeaderChecker('S1').stateIndices(2),
                  new HeaderChecker('S2').stateIndices(3).same()),
              new HeaderChecker('S3').stateIndices(4).same(),
              new HeaderChecker('H2').stateIndices(5, 6).same()
                .states(
                  new HeaderChecker('S4').stateIndices(5).same(),
                  new HeaderChecker('S5').stateIndices(6).same()),
              new HeaderChecker('S6').stateIndices(7).same());
            original = headers;
          });

        // All category states invisible, category should  be invisible too
        util.getUserSettingUpdater().updateVisibility(false, 2, 3)
          .easySubscribeHeaders(headers => {
            checkAndCompare(headers.headersList, original,
              new HeaderChecker('Backlog').stateIndices(0, 1).backlog().invisible().same()
                .states(
                  new HeaderChecker('B1').stateIndices(0).backlog().invisible().same(),
                  new HeaderChecker('B2').stateIndices(1).backlog().invisible().same()),
              new HeaderChecker('H1').stateIndices(2, 3).invisible()
                .states(
                  new HeaderChecker('S1').stateIndices(2).invisible(),
                  new HeaderChecker('S2').stateIndices(3).invisible()),
              new HeaderChecker('S3').stateIndices(4).same(),
              new HeaderChecker('H2').stateIndices(5, 6).same()
                .states(
                  new HeaderChecker('S4').stateIndices(5).same(),
                  new HeaderChecker('S5').stateIndices(6).same()),
              new HeaderChecker('S6').stateIndices(7).same());
            original = headers;
          });

        // All category states visible, category should  be invisible too
        util.getUserSettingUpdater().updateVisibility(true, 2, 3)
          .easySubscribeHeaders(headers => {
            checkAndCompare(headers.headersList, original,
              new HeaderChecker('Backlog').stateIndices(0, 1).backlog().invisible().same()
                .states(
                  new HeaderChecker('B1').stateIndices(0).backlog().invisible().same(),
                  new HeaderChecker('B2').stateIndices(1).backlog().invisible().same()),
              new HeaderChecker('H1').stateIndices(2, 3)
                .states(
                  new HeaderChecker('S1').stateIndices(2),
                  new HeaderChecker('S2').stateIndices(3)),
              new HeaderChecker('S3').stateIndices(4).same(),
              new HeaderChecker('H2').stateIndices(5, 6).same()
                .states(
                  new HeaderChecker('S4').stateIndices(5).same(),
                  new HeaderChecker('S5').stateIndices(6).same()),
              new HeaderChecker('S6').stateIndices(7).same());
            original = headers;
          });
      });
    });

    describe('Show backlog, initial visible', () => {
      beforeEach(() => {
        util = new BoardViewObservableUtil({bl: 'true', visible: '0,2,4'})
          .updateBoardState(createInitialiser());
        util
          .easySubscribeHeaders(headers => {
            check(headers.headersList,
              new HeaderChecker('Backlog').stateIndices(0, 1).backlog()
                .states(
                  new HeaderChecker('B1').stateIndices(0).backlog(),
                  new HeaderChecker('B2').stateIndices(1).backlog().invisible()),
              new HeaderChecker('H1').stateIndices(2, 3)
                .states(
                  new HeaderChecker('S1').stateIndices(2),
                  new HeaderChecker('S2').stateIndices(3).invisible()),
              new HeaderChecker('S3').stateIndices(4),
              new HeaderChecker('H2').stateIndices(5, 6).invisible()
                .states(
                  new HeaderChecker('S4').stateIndices(5).invisible(),
                  new HeaderChecker('S5').stateIndices(6).invisible()),
              new HeaderChecker('S6').stateIndices(7).invisible());
            original = headers;
          });
      });

      it('Toggle backlog', () => {
        // DON'T TOGGLE all of them and assume that the backlog will be toggled
        // - that is handled by the header group component
        util.getUserSettingUpdater().updateVisibility(true, 1)
          .easySubscribeHeaders(headers => {
            checkAndCompare(headers.headersList, original,
              new HeaderChecker('Backlog').stateIndices(0, 1).backlog()
                .states(
                  new HeaderChecker('B1').stateIndices(0).backlog().same(),
                  new HeaderChecker('B2').stateIndices(1).backlog()),
              new HeaderChecker('H1').stateIndices(2, 3).same()
                .states(
                  new HeaderChecker('S1').stateIndices(2).same(),
                  new HeaderChecker('S2').stateIndices(3).invisible().same()),
              new HeaderChecker('S3').stateIndices(4).same(),
              new HeaderChecker('H2').stateIndices(5, 6).invisible().same()
                .states(
                  new HeaderChecker('S4').stateIndices(5).invisible().same(),
                  new HeaderChecker('S5').stateIndices(6).invisible().same()),
              new HeaderChecker('S6').stateIndices(7).invisible().same());
            original = headers;
          });

        // Toggle the backlog to invisible
        // The toggle itself is a noop
        util.getUserSettingUpdater().toggleBacklog()
          .easySubscribeHeaders(headers => {
            expect(headers).toBe(original);
          });
        // The caller (BoardComponent) does a full refresh to load the board again which rebuilds it
        util.updateBoardState(createInitialiser())
          .easySubscribeHeaders(headers => {
            expect(headers).not.toBe(original);
            checkAndCompare(headers.headersList, original,
              new HeaderChecker('Backlog').stateIndices(0, 1).backlog().invisible()
                .states(
                  new HeaderChecker('B1').stateIndices(0).backlog().invisible(),
                  new HeaderChecker('B2').stateIndices(1).backlog().invisible()),
              new HeaderChecker('H1').stateIndices(2, 3).same()
                .states(
                  new HeaderChecker('S1').stateIndices(2).same(),
                  new HeaderChecker('S2').stateIndices(3).invisible().same()),
              new HeaderChecker('S3').stateIndices(4).same(),
              new HeaderChecker('H2').stateIndices(5, 6).invisible().same()
                .states(
                  new HeaderChecker('S4').stateIndices(5).invisible().same(),
                  new HeaderChecker('S5').stateIndices(6).invisible().same()),
              new HeaderChecker('S6').stateIndices(7).invisible().same());

            original = headers;
          });

        // Toggle the backlog to visible
        // Toggle the backlog to invisible
        // The toggle itself is a noop
        util.getUserSettingUpdater().toggleBacklog()
          .easySubscribeHeaders(headers => {
            expect(headers).toBe(original);
          });
        // The caller (BoardComponent) does a full refresh to load the board again which rebuilds it
        util.updateBoardState(createInitialiser())
          .easySubscribeHeaders(headers => {
            expect(headers).not.toBe(original);
            checkAndCompare(headers.headersList, original,
              new HeaderChecker('Backlog').stateIndices(0, 1).backlog()
                .states(
                  new HeaderChecker('B1').stateIndices(0).backlog(),
                  new HeaderChecker('B2').stateIndices(1).backlog()),
              new HeaderChecker('H1').stateIndices(2, 3).same()
                .states(
                  new HeaderChecker('S1').stateIndices(2).same(),
                  new HeaderChecker('S2').stateIndices(3).invisible().same()),
              new HeaderChecker('S3').stateIndices(4).same(),
              new HeaderChecker('H2').stateIndices(5, 6).invisible().same()
                .states(
                  new HeaderChecker('S4').stateIndices(5).invisible().same(),
                  new HeaderChecker('S5').stateIndices(6).invisible().same()),
              new HeaderChecker('S6').stateIndices(7).invisible().same());

            original = headers;
          });
      });

      it('Toggle states not in category', () => {
        util.getUserSettingUpdater().updateVisibility(false, 4)
          .easySubscribeHeaders(headers => {
            checkAndCompare(headers.headersList, original,
              new HeaderChecker('Backlog').stateIndices(0, 1).backlog().same()
                .states(
                  new HeaderChecker('B1').stateIndices(0).backlog().same(),
                  new HeaderChecker('B2').stateIndices(1).backlog().invisible().same()),
              new HeaderChecker('H1').stateIndices(2, 3).same()
                .states(
                  new HeaderChecker('S1').stateIndices(2).same(),
                  new HeaderChecker('S2').stateIndices(3).invisible().same()),
              new HeaderChecker('S3').stateIndices(4).invisible(),
              new HeaderChecker('H2').stateIndices(5, 6).invisible().same()
                .states(
                  new HeaderChecker('S4').stateIndices(5).invisible().same(),
                  new HeaderChecker('S5').stateIndices(6).invisible().same()),
              new HeaderChecker('S6').stateIndices(7).invisible().same());

            original = headers;
          });

        util.getUserSettingUpdater().updateVisibility(true, 7)
          .easySubscribeHeaders(headers => {
            checkAndCompare(headers.headersList, original,
              new HeaderChecker('Backlog').stateIndices(0, 1).backlog().same()
                .states(
                  new HeaderChecker('B1').stateIndices(0).backlog().same(),
                  new HeaderChecker('B2').stateIndices(1).backlog().invisible().same()),
              new HeaderChecker('H1').stateIndices(2, 3).same()
                .states(
                  new HeaderChecker('S1').stateIndices(2).same(),
                  new HeaderChecker('S2').stateIndices(3).invisible().same()),
              new HeaderChecker('S3').stateIndices(4).invisible().same(),
              new HeaderChecker('H2').stateIndices(5, 6).invisible().same()
                .states(
                  new HeaderChecker('S4').stateIndices(5).invisible().same(),
                  new HeaderChecker('S5').stateIndices(6).invisible().same()),
              new HeaderChecker('S6').stateIndices(7));
          });
      });

      it('Toggle states in category', () => {
        util.getUserSettingUpdater().updateVisibility(false, 2)
          .easySubscribeHeaders(headers => {
            checkAndCompare(headers.headersList, original,
              new HeaderChecker('Backlog').stateIndices(0, 1).backlog().same()
                .states(
                  new HeaderChecker('B1').stateIndices(0).backlog().same(),
                  new HeaderChecker('B2').stateIndices(1).backlog().invisible().same()),
              new HeaderChecker('H1').stateIndices(2, 3).invisible()
                .states(
                  new HeaderChecker('S1').stateIndices(2).invisible(),
                  new HeaderChecker('S2').stateIndices(3).invisible().same()),
              new HeaderChecker('S3').stateIndices(4).same(),
              new HeaderChecker('H2').stateIndices(5, 6).invisible().same()
                .states(
                  new HeaderChecker('S4').stateIndices(5).invisible().same(),
                  new HeaderChecker('S5').stateIndices(6).invisible().same()),
              new HeaderChecker('S6').stateIndices(7).invisible().same());

            original = headers;
          });

        util.getUserSettingUpdater().updateVisibility(true, 3)
          .easySubscribeHeaders(headers => {
            checkAndCompare(headers.headersList, original,
              new HeaderChecker('Backlog').stateIndices(0, 1).backlog().same()
                .states(
                  new HeaderChecker('B1').stateIndices(0).backlog().same(),
                  new HeaderChecker('B2').stateIndices(1).backlog().invisible().same()),
              new HeaderChecker('H1').stateIndices(2, 3)
                .states(
                  new HeaderChecker('S1').stateIndices(2).invisible().same(),
                  new HeaderChecker('S2').stateIndices(3)),
              new HeaderChecker('S3').stateIndices(4).same(),
              new HeaderChecker('H2').stateIndices(5, 6).invisible().same()
                .states(
                  new HeaderChecker('S4').stateIndices(5).invisible().same(),
                  new HeaderChecker('S5').stateIndices(6).invisible().same()),
              new HeaderChecker('S6').stateIndices(7).invisible().same());

            original = headers;
          });

        util.getUserSettingUpdater().updateVisibility(true, 5, 6)
          .easySubscribeHeaders(headers => {
            checkAndCompare(headers.headersList, original,
              new HeaderChecker('Backlog').stateIndices(0, 1).backlog().same()
                .states(
                  new HeaderChecker('B1').stateIndices(0).backlog().same(),
                  new HeaderChecker('B2').stateIndices(1).backlog().invisible().same()),
              new HeaderChecker('H1').stateIndices(2, 3).same()
                .states(
                  new HeaderChecker('S1').stateIndices(2).invisible().same(),
                  new HeaderChecker('S2').stateIndices(3).same()),
              new HeaderChecker('S3').stateIndices(4).same(),
              new HeaderChecker('H2').stateIndices(5, 6)
                .states(
                  new HeaderChecker('S4').stateIndices(5),
                  new HeaderChecker('S5').stateIndices(6)),
              new HeaderChecker('S6').stateIndices(7).invisible().same());

            original = headers;
          });
      });
    });

    describe('Show backlog, initial hidden', () => {
      beforeEach(() => {
        util = new BoardViewObservableUtil({bl: 'true', hidden: '0,2,3,4'})
          .updateBoardState(createInitialiser());
        util
          .easySubscribeHeaders(headers => {
            check(headers.headersList,
              new HeaderChecker('Backlog').stateIndices(0, 1).backlog()
                .states(
                  new HeaderChecker('B1').stateIndices(0).backlog().invisible(),
                  new HeaderChecker('B2').stateIndices(1).backlog()),
              new HeaderChecker('H1').stateIndices(2, 3).invisible()
                .states(
                  new HeaderChecker('S1').stateIndices(2).invisible(),
                  new HeaderChecker('S2').stateIndices(3).invisible()),
              new HeaderChecker('S3').stateIndices(4).invisible(),
              new HeaderChecker('H2').stateIndices(5, 6)
                .states(
                  new HeaderChecker('S4').stateIndices(5),
                  new HeaderChecker('S5').stateIndices(6)),
              new HeaderChecker('S6').stateIndices(7));
            original = headers;
          });
      });

      it('Toggle backlog', () => {
        // Toggle the invisible state back to true
        // DON'T TOGGLE all of them and assume that the backlog will be toggled
        // - that is handled by the header group component

        util.getUserSettingUpdater().updateVisibility(true, 0)
          .easySubscribeHeaders(headers => {
            checkAndCompare(headers.headersList, original,
              new HeaderChecker('Backlog').stateIndices(0, 1).backlog()
                .states(
                  new HeaderChecker('B1').stateIndices(0).backlog(),
                  new HeaderChecker('B2').stateIndices(1).backlog().same()),
              new HeaderChecker('H1').stateIndices(2, 3).invisible().same()
                .states(
                  new HeaderChecker('S1').stateIndices(2).invisible().same(),
                  new HeaderChecker('S2').stateIndices(3).invisible().same()),
              new HeaderChecker('S3').stateIndices(4).invisible().same(),
              new HeaderChecker('H2').stateIndices(5, 6).same()
                .states(
                  new HeaderChecker('S4').stateIndices(5).same(),
                  new HeaderChecker('S5').stateIndices(6).same()),
              new HeaderChecker('S6').stateIndices(7).same());
            original = headers;
          });

        // Toggle the backlog to invisible
        util.getUserSettingUpdater().toggleBacklog()
          .easySubscribeHeaders(headers => {
            expect(headers).toBe(original);
          });
        // The caller (BoardComponent) does a full refresh to load the board again which rebuilds it
        util.updateBoardState(createInitialiser())
          .easySubscribeHeaders(headers => {
            expect(headers).not.toBe(original);
            checkAndCompare(headers.headersList, original,
              new HeaderChecker('Backlog').stateIndices(0, 1).backlog().invisible()
                .states(
                  new HeaderChecker('B1').stateIndices(0).backlog().invisible(),
                  new HeaderChecker('B2').stateIndices(1).backlog().invisible()),
              new HeaderChecker('H1').stateIndices(2, 3).invisible().same()
                .states(
                  new HeaderChecker('S1').stateIndices(2).invisible().same(),
                  new HeaderChecker('S2').stateIndices(3).invisible().same()),
              new HeaderChecker('S3').stateIndices(4).invisible().same(),
              new HeaderChecker('H2').stateIndices(5, 6).same()
                .states(
                  new HeaderChecker('S4').stateIndices(5).same(),
                  new HeaderChecker('S5').stateIndices(6).same()),
              new HeaderChecker('S6').stateIndices(7).same());

            original = headers;
          });

        // Toggle the backlog to visible
        util.getUserSettingUpdater().toggleBacklog()
          .easySubscribeHeaders(headers => {
            expect(headers).toBe(original);
          });
        // The caller (BoardComponent) does a full refresh to load the board again which rebuilds it
        util.updateBoardState(createInitialiser())
          .easySubscribeHeaders(headers => {
            expect(headers).not.toBe(original);
            checkAndCompare(headers.headersList, original,
              new HeaderChecker('Backlog').stateIndices(0, 1).backlog()
                .states(
                  new HeaderChecker('B1').stateIndices(0).backlog(),
                  new HeaderChecker('B2').stateIndices(1).backlog()),
              new HeaderChecker('H1').stateIndices(2, 3).invisible().same()
                .states(
                  new HeaderChecker('S1').stateIndices(2).invisible().same(),
                  new HeaderChecker('S2').stateIndices(3).invisible().same()),
              new HeaderChecker('S3').stateIndices(4).invisible().same(),
              new HeaderChecker('H2').stateIndices(5, 6).same()
                .states(
                  new HeaderChecker('S4').stateIndices(5).same(),
                  new HeaderChecker('S5').stateIndices(6).same()),
              new HeaderChecker('S6').stateIndices(7).same());

            original = headers;
          });
      });

      it('Toggle states not in category', () => {
        util.getUserSettingUpdater().updateVisibility(true, 4)
          .easySubscribeHeaders(headers => {
            checkAndCompare(headers.headersList, original,
              new HeaderChecker('Backlog').stateIndices(0, 1).backlog().same()
                .states(
                  new HeaderChecker('B1').stateIndices(0).backlog().invisible().same(),
                  new HeaderChecker('B2').stateIndices(1).backlog().same()),
              new HeaderChecker('H1').stateIndices(2, 3).invisible().same()
                .states(
                  new HeaderChecker('S1').stateIndices(2).invisible().same(),
                  new HeaderChecker('S2').stateIndices(3).invisible().same()),
              new HeaderChecker('S3').stateIndices(4),
              new HeaderChecker('H2').stateIndices(5, 6).same()
                .states(
                  new HeaderChecker('S4').stateIndices(5).same(),
                  new HeaderChecker('S5').stateIndices(6).same()),
              new HeaderChecker('S6').stateIndices(7).same());

            original = headers;
          });

        util.getUserSettingUpdater().updateVisibility(false, 7)
          .easySubscribeHeaders(headers => {
            checkAndCompare(headers.headersList, original,
              new HeaderChecker('Backlog').stateIndices(0, 1).backlog().same()
                .states(
                  new HeaderChecker('B1').stateIndices(0).backlog().invisible().same(),
                  new HeaderChecker('B2').stateIndices(1).backlog().same()),
              new HeaderChecker('H1').stateIndices(2, 3).invisible().same()
                .states(
                  new HeaderChecker('S1').stateIndices(2).invisible().same(),
                  new HeaderChecker('S2').stateIndices(3).invisible().same()),
              new HeaderChecker('S3').stateIndices(4).same(),
              new HeaderChecker('H2').stateIndices(5, 6).same()
                .states(
                  new HeaderChecker('S4').stateIndices(5).same(),
                  new HeaderChecker('S5').stateIndices(6).same()),
              new HeaderChecker('S6').stateIndices(7).invisible());

            original = headers;
          });

      });

      it('Toggle states in category', () => {
        util.getUserSettingUpdater().updateVisibility(true, 2)
          .easySubscribeHeaders(headers => {
            checkAndCompare(headers.headersList, original,
              new HeaderChecker('Backlog').stateIndices(0, 1).backlog().same()
                .states(
                  new HeaderChecker('B1').stateIndices(0).backlog().invisible().same(),
                  new HeaderChecker('B2').stateIndices(1).backlog().same()),
              new HeaderChecker('H1').stateIndices(2, 3)
                .states(
                  new HeaderChecker('S1').stateIndices(2),
                  new HeaderChecker('S2').stateIndices(3).invisible().same()),
              new HeaderChecker('S3').stateIndices(4).invisible().same(),
              new HeaderChecker('H2').stateIndices(5, 6).same()
                .states(
                  new HeaderChecker('S4').stateIndices(5).same(),
                  new HeaderChecker('S5').stateIndices(6).same()),
              new HeaderChecker('S6').stateIndices(7).same());

            original = headers;
          });

        util.getUserSettingUpdater().updateVisibility(true, 3)
          .easySubscribeHeaders(headers => {
            checkAndCompare(headers.headersList, original,
              new HeaderChecker('Backlog').stateIndices(0, 1).backlog().same()
                .states(
                  new HeaderChecker('B1').stateIndices(0).backlog().invisible().same(),
                  new HeaderChecker('B2').stateIndices(1).backlog().same()),
              new HeaderChecker('H1').stateIndices(2, 3)
                .states(
                  new HeaderChecker('S1').stateIndices(2).same(),
                  new HeaderChecker('S2').stateIndices(3)),
              new HeaderChecker('S3').stateIndices(4).invisible().same(),
              new HeaderChecker('H2').stateIndices(5, 6).same()
                .states(
                  new HeaderChecker('S4').stateIndices(5).same(),
                  new HeaderChecker('S5').stateIndices(6).same()),
              new HeaderChecker('S6').stateIndices(7).same());

            original = headers;
          });

        util.getUserSettingUpdater().updateVisibility(false, 5, 6)
          .easySubscribeHeaders(headers => {
            checkAndCompare(headers.headersList, original,
              new HeaderChecker('Backlog').stateIndices(0, 1).backlog().same()
                .states(
                  new HeaderChecker('B1').stateIndices(0).backlog().invisible().same(),
                  new HeaderChecker('B2').stateIndices(1).backlog().same()),
              new HeaderChecker('H1').stateIndices(2, 3).same()
                .states(
                  new HeaderChecker('S1').stateIndices(2).same(),
                  new HeaderChecker('S2').stateIndices(3).same()),
              new HeaderChecker('S3').stateIndices(4).invisible().same(),
              new HeaderChecker('H2').stateIndices(5, 6).invisible()
                .states(
                  new HeaderChecker('S4').stateIndices(5).invisible(),
                  new HeaderChecker('S5').stateIndices(6).invisible()),
              new HeaderChecker('S6').stateIndices(7).same());

            original = headers;
          });
      });
    });

    function createInitialiser() {
      const states = [
        // No wip or headers for the backlog states
        {name: 'B1'},
        {name: 'B2'},
        {name: 'S1', header: 0},
        {name: 'S2', header: 0},
        {name: 'S3'},
        {name: 'S4', header: 1},
        {name: 'S5', header: 1},
        {name: 'S6'}];
      return new BoardStateInitializer()
        .issuesFactory(new EmptyIssuesFactory())
        .headerStateFactory(new TestHeaderStateFactory(states, ['H1', 'H2'], 2, 0));

    }
  });

  describe('Help Texts', () => {
    let original: BoardHeaders;
    beforeEach(() => {
      util = createInitialiser();
      util
        .easySubscribeHeaders(headers => {
          check(headers.headersList,
            new HeaderChecker('Backlog').stateIndices(0, 1).counts(2, 2).backlog()
              .states(
                new HeaderChecker('B1').stateIndices(0).counts(1, 1).backlog(),
                new HeaderChecker('B2').stateIndices(1).counts(1, 1).backlog()),
            new HeaderChecker('H1').stateIndices(2, 3).counts(2, 2)
              .states(
                new HeaderChecker('S1').stateIndices(2).counts(1, 1),
                new HeaderChecker('S2').stateIndices(3).counts(1, 1)),
            new HeaderChecker('S3').stateIndices(4).counts(1, 1).invisible(),
            new HeaderChecker('H2').stateIndices(5, 6).counts(3, 3)
              .states(
                new HeaderChecker('S4').stateIndices(5).counts(1, 1).invisible(),
                new HeaderChecker('S5').stateIndices(6).counts(2, 2)),
            new HeaderChecker('S6').stateIndices(7).counts(1, 1));
          original = headers;
        });
    });

    it('Empty help texts', () => {
      util.getBoardStateUpdater().setHelpTexts({}).emit()
        .easySubscribeHeaders(headers => {
          expect(headers).toBe(original);
        });
    });

    it('Initialise help texts', () => {
      const help: any = {
        B2: 'B-One',
        S2: 'Two',
        S6: 'Six'
      };
      util.getBoardStateUpdater().setHelpTexts(help).emit()
        .easySubscribeHeaders(headers => {
          checkAndCompare(headers.headersList, original,
            new HeaderChecker('Backlog').stateIndices(0, 1).counts(2, 2).backlog()
              .states(
                new HeaderChecker('B1').stateIndices(0).counts(1, 1).backlog().same(),
                new HeaderChecker('B2').stateIndices(1).counts(1, 1).help('B-One').backlog()),
            new HeaderChecker('H1').stateIndices(2, 3).counts(2, 2)
              .states(
                new HeaderChecker('S1').stateIndices(2).counts(1, 1).same(),
                new HeaderChecker('S2').stateIndices(3).counts(1, 1).help('Two')),
            new HeaderChecker('S3').stateIndices(4).counts(1, 1).invisible().same(),
            new HeaderChecker('H2').stateIndices(5, 6).counts(3, 3).same()
              .states(
                new HeaderChecker('S4').stateIndices(5).counts(1, 1).invisible().same(),
                new HeaderChecker('S5').stateIndices(6).counts(2, 2).same()),
            new HeaderChecker('S6').stateIndices(7).counts(1, 1).help('Six'));
        });
    });

    function createInitialiser(): BoardViewObservableUtil {
      const headerStateFactory: HeaderStateFactory = new TestHeaderStateFactory([
        {name: 'B1'},
        {name: 'B2'},
        {name: 'S1', header: 0},
        {name: 'S2', header: 0},
        {name: 'S3'},
        {name: 'S4', header: 1},
        {name: 'S5', header: 1},
        {name: 'S6'}], ['H1', 'H2'], 2);

      return new BoardViewObservableUtil({hidden: '4,5', bl: 'true'})
        .updateBoardState(
          new BoardStateInitializer()
            .headerStateFactory(headerStateFactory)
            .setRank('ONE', 1, 2, 3, 4, 5, 6, 7, 8, 9)
            .mapState('ONE', 'B1', '1-A')
            .mapState('ONE', 'B2', '1-B')
            .mapState('ONE', 'S1', '1-1')
            .mapState('ONE', 'S2', '1-2')
            .mapState('ONE', 'S3', '1-3')
            .mapState('ONE', 'S4', '1-4')
            .mapState('ONE', 'S5', '1-5')
            .mapState('ONE', 'S6', '1-6')
            .issuesFactory(
              new SimpleIssueFactory()
                .addIssue('ONE-1', 0)
                .addIssue('ONE-2', 1)
                .addIssue('ONE-3', 2)
                .addIssue('ONE-4', 3)
                .addIssue('ONE-5', 4)
                .addIssue('ONE-6', 5)
                .addIssue('ONE-7', 6)
                .addIssue('ONE-8', 6)
                .addIssue('ONE-9', 7)
            ));
    }
  });
});

function checkAndCompare(headers: List<BoardHeader>, original: BoardHeaders, ...checkers: HeaderChecker[]) {
  check(headers, ...checkers);
  for (let i = 0; i < checkers.length; i++) {
    const header: BoardHeader = headers.get(i);
    const originalHeader: BoardHeader = original.headersList.get(i);
    const checker: HeaderChecker = checkers[i];
    if (checker.isSame()) {
      expect(header).toBe(originalHeader);
    } else {
      expect(header).not.toBe(originalHeader);
    }
    if (header.category) {
      for (let j = 0; j < header.states.size; j++) {
        const stateHeader: BoardHeader = header.states.get(j);
        const originalStateHeader: BoardHeader = originalHeader.states.get(j);
        const stateChecker: HeaderChecker = checker.getStates()[j];
        if (stateChecker.isSame()) {
          expect(stateHeader).toBe(originalStateHeader);
        } else {
          expect(stateHeader).not.toBe(originalStateHeader);
        }
      }
    }
  }
}


function check(headers: List<BoardHeader>, ...checkers: HeaderChecker[]) {
  expect(headers.size).toBe(checkers.length);
  for (let i = 0; i < checkers.length; i++) {
    checkers[i].check(headers.get(i));
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
    if (this._issueKeys) {
      for (let i = 0; i < this._issueKeys.length; i++) {
        const id = Number(this._issueKeys[i].substr(this._issueKeys[i].indexOf('-') + 1));
        input[this._issueKeys[i]] = {
          key: this._issueKeys[i],
          type: id % 2,
          priority: id % 2,
          summary: '-',
          state: this._issueStates[i]
        };
      }
    }
    return input;
  }
}

class HeaderChecker {
  _name: string;
  _abbreviated: string;
  _stateIndices: number[];
  _wip = 0;
  _backlog = false;
  _visible = true;
  _totalIssues = 0;
  _visibleIssues = 0;
  _states: HeaderChecker[];
  _same = false;
  _help: string;

  constructor(name: string) {
    this._name = name;
  }

  abbreviated(abbreviated: string): HeaderChecker {
    this._abbreviated = abbreviated;
    return this;
  }

  stateIndices(...indices: number[]): HeaderChecker {
    this._stateIndices = indices;
    return this;
  }

  wip(wip: number): HeaderChecker {
    this._wip = wip;
    return this;
  }

  backlog(): HeaderChecker {
    this._backlog = true;
    return this;
  }

  invisible(): HeaderChecker {
    this._visible = false;
    return this;
  }

  states(...states: HeaderChecker[]): HeaderChecker {
    this._states = states;
    return this;
  }

  counts(visible, total): HeaderChecker {
    this._visibleIssues = visible;
    this._totalIssues = total;
    return this;
  }

  isSame(): boolean {
    return this._same;
  }

  getStates(): HeaderChecker[] {
    return this._states;
  }

  same(): HeaderChecker {
    this._same = true;
    return this;
  }

  help(help: string): HeaderChecker {
    this._help = help;
    return this;
  }

  check(header: BoardHeader) {
    expect(header.name).toEqual(this._name, header.name);
    expect(header.wip).toEqual(this._wip, header.name);
    expect(header.backlog).toEqual(this._backlog, header.name);
    expect(header.stateIndices.toArray()).toEqual(this._stateIndices, header.name);
    expect(header.visible).toBe(this._visible, header.name);
    expect(header.totalIssues).toBe(this._totalIssues, header.name);
    expect(header.visibleIssues).toBe(this._visibleIssues, header.name);
    if (!this._states) {
      expect(header.category).toBe(false, header.name);
      expect(header.states).toBeFalsy(header.name);
    } else {
      expect(header.category).toBe(true, header.name);
      check(header.states, ...this._states);
    }
    if (this._abbreviated) {
      expect(header.abbreviation).toEqual(this._abbreviated, header.name);
    }
    if (this._help) {
      expect(header.helpText).toEqual(this._help, header.name);
    } else {
      expect(header.helpText).toBeFalsy(header.name);
    }
  }
}

class TestHeaderStateFactory implements HeaderStateFactory {
  constructor(private _states: any[], private _headers: string[], private _backlog?: number, private _done?: number) {
  }

  createHeaderState(currentState: HeaderState): HeaderState {
    return headerMetaReducer(currentState,
      HeaderActions.createDeserializeHeaders(this._states, this._headers, this._backlog ? this._backlog : 0, this._done ? this._done : 0));
  }
}

class EmptyIssuesFactory implements IssuesFactory {

  clear() {
  }

  createIssueStateInput(params: DeserializeIssueLookupParams): any {
    return {};
  }
}

