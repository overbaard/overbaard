import {BoardQueryParamsHandler} from './board-query-params.service';
import {UserSettingState} from '../model/board/user/user-setting';
import {Observable, Subject, BehaviorSubject} from 'rxjs';
import {initialUserSettingState, UserSettingUtil} from '../model/board/user/user-setting.model';
import {BoardState} from '../model/board/data/board';
import {BoardUtil, initialBoardState} from '../model/board/data/board.model';
import {Dictionary} from '../common/dictionary';
import {UserSettingActions, userSettingReducer} from '../model/board/user/user-setting.reducer';
import {BoardViewMode} from '../model/board/user/board-view-mode';
import {List, Map, Set} from 'immutable';
import {BoardFilterUtil, initialBoardFilterState} from '../model/board/user/board-filter/board-filter.model';
import {HeaderUtil, initialHeaderState} from '../model/board/data/header/header.model';
import {HeaderState} from '../model/board/data/header/header.state';
import {IssueSummaryLevel} from '../model/board/user/issue-summary-level';
import {IssueDetailUtil} from '../model/board/user/issue-detail/issue-detail.model';
import {take} from 'rxjs/operators';

describe('Boards Query Parameters Service Tests', () => {
  const userSettingSubject: Subject<UserSettingState> = new BehaviorSubject<UserSettingState>(initialUserSettingState);
  const boardSubject: Subject<BoardState> = new BehaviorSubject<BoardState>(initialBoardState);
  let urlObservable: Observable<string>;
  let userSettingState: UserSettingState;

  beforeEach(() => {
    const handler: BoardQueryParamsHandler = new BoardQueryParamsHandler();
    // Do the initial load of the settings that happens in the board component and which gets ignored
    const params: Dictionary<string> = {
      board: 'TST&=1'
    };
    userSettingState = userSettingReducer(initialUserSettingState, UserSettingActions.createInitialiseFromQueryString(params));
    userSettingSubject.next(userSettingState);
    urlObservable = handler.getBoardViewModel(boardSubject, userSettingSubject);
    urlObservable
      .pipe(
        take(1)
      )
      .subscribe(s => {
        expect(s).toBe(null);
    });
  });

  describe('Basic', () => {
    it ('test simple (backlog=true only)', () => {
      const newSetting: UserSettingState = UserSettingUtil.updateUserSettingState(userSettingState, mutable => {
        mutable.showBacklog = true;
      });
      userSettingSubject.next(newSetting);
      urlObservable
        .pipe(
          take(1)
        )
        .subscribe(s => {
          expect(s).toBe('board=TST%26%3D1&bl=true');
      });
    });

    it ('Board State only is ignored', () => {
      const newBoard: BoardState = BoardUtil.withMutations(initialBoardState, mutable => {
        mutable.viewId = 999;
      });
      boardSubject.next(newBoard);
      urlObservable
        .pipe(
          take(1)
        )
        .subscribe(s => {
          expect(s).toBe(null);
      });
    });
  });

  describe('Deparse querystring', () => {
    it ('Minimal (implied defaults)', () => {
      const newSetting: UserSettingState = UserSettingUtil.updateUserSettingState(userSettingState, mutable => {
        mutable.boardCode = 'TEST&=123';
      });
      userSettingSubject.next(newSetting);
      urlObservable
        .pipe(
          take(1)
        )
        .subscribe(s => {
          const parsedState = userSettingStateFromQueryString(s);
          expect(parsedState).toEqual(newSetting);
      });
    });
    it ('Minimal (explicit defaults)', () => {
      const newSetting: UserSettingState = UserSettingUtil.updateUserSettingState(userSettingState, mutable => {
        mutable.boardCode = 'TEST&=123';
        mutable.showBacklog = false;
        mutable.viewMode = BoardViewMode.KANBAN;
        mutable.issueDetail = IssueDetailUtil.updateIssueDetailState(mutable.issueDetail, issueDetail => {
          issueDetail.issueSummaryLevel = IssueSummaryLevel.FULL;
          issueDetail.parallelTasks = true;
        });
      });
      userSettingSubject.next(newSetting);
      urlObservable
        .pipe(
          take(1)
        )
        .subscribe(s => {
          const parsedState = userSettingStateFromQueryString(s);
          expect(parsedState).toEqual(newSetting);
      });
    });
    it ('Everything apart from visibilities', () => {
      const newBoard: BoardState = BoardUtil.withMutations(initialBoardState, mutable => {
        mutable.viewId = 999;
        mutable.headers = {
          states: List<string>(['a', 'b', 'c', 'd']),
          backlog: 1,
          wip: null,
          categories: null,
          stateToCategoryMappings: null,
          helpTexts: null
        };
      });
      boardSubject.next(newBoard);
      urlObservable
        .pipe(
          take(1)
        )
        .subscribe(s => {
      });
      const newSetting: UserSettingState = UserSettingUtil.updateUserSettingState(userSettingState, mutable => {
        mutable.boardCode = 'TEST&=123';
        mutable.showBacklog = true;
        mutable.viewMode = BoardViewMode.RANK;
        mutable.issueDetail = IssueDetailUtil.updateIssueDetailState(mutable.issueDetail, issueDetail => {
          issueDetail.issueSummaryLevel = IssueSummaryLevel.SHORT_SUMMARY_NO_AVATAR;
          issueDetail.parallelTasks = false;
        });
        mutable.forceBacklog = true;
        mutable.swimlane = 'project'; // Not really valid when we use rank but still
        mutable.filters = BoardFilterUtil.updateBoardFilterState(initialBoardFilterState, mutable2 => {
          mutable2.project = Set<string>(['PROJ&=1', 'PROJ&=2']);
          mutable2.priority = Set<string>(['P&=1', 'P&=2']);
          mutable2.issueType = Set<string>(['T&=1', 'T&=2']);
          mutable2.assignee = Set<string>(['A&=1', 'A&=2']);
          mutable2.component = Set<string>(['C&=1', 'C&=2']);
          mutable2.label = Set<string>(['L&=1', 'L&=2']);
          mutable2.fixVersion = Set<string>(['F&=1', 'F&=2']);
          mutable2.customField = Map<string, Set<string>>({
            'CF&=1': Set<string>(['CF1&=A', 'CF1&=B']),
            'CF&=2': Set<string>(['CF2&=A', 'CF2&=B']),
          });
          mutable2.parallelTask = Map<string, Set<string>>({
            'PT&1': Set<string>(['PT1&=A', 'PT1&=B']),
            'PT&2': Set<string>(['PT2&=A', 'PT2&=B']),
          });
        });
      });
      userSettingSubject.next(newSetting);
      urlObservable
        .pipe(
          take(1)
        )
        .subscribe(s => {
          const parsedState = userSettingStateFromQueryString(s);
          // Immutable doesn't love equals comparison of nested things so convert to plain objects here
          const parsedObject: Object = JSON.parse(JSON.stringify(parsedState));
          const newSettingObject: Object = JSON.parse(JSON.stringify(newSetting));
          expect(parsedObject).toEqual(JSON.parse(JSON.stringify(newSettingObject)));
      });
    });
  });

  describe('Visibilties', () => {
    describe('Column', () => {
      let headerState: HeaderState;
      beforeEach(() => {
        headerState = HeaderUtil.withMutations(initialHeaderState, hdr => {
          hdr.states = List<string>(['a', 'b', 'c', 'd', 'd', 'e', 'f', 'g', 'h']);
          hdr.backlog = 0;
        });
      });
      describe('No Backlog', () => {
        let board: BoardState;
        beforeEach(() => {
          board = BoardUtil.withMutations(initialBoardState, mutable => {
            mutable.viewId = 999;
            mutable.headers = headerState;
          });
          boardSubject.next(board);
        });

        describe('Not initialized with visibilities', () => {
          it ('toggle visibilities', () => {
            userSettingState =
              userSettingReducer(userSettingState,
                UserSettingActions.createToggleVisibility(false, List<number>([1, 2, 3, 4])));
            userSettingSubject.next(userSettingState);
            urlObservable
              .pipe(
                take(1)
              )
              .subscribe(s => {
                expect(s).toContain('hidden=1,2,3,4');
                expect(2).not.toContain('visible');
            });
            userSettingState =
              userSettingReducer(userSettingState,
                UserSettingActions.createToggleVisibility(false, List<number>([5, 6, 7])));
            userSettingSubject.next(userSettingState);
            urlObservable
              .pipe(
                take(1)
              )
              .subscribe(s => {
                expect(s).toContain('visible=0,8');
                expect(s).not.toContain('hidden');
            });
            userSettingState =
              userSettingReducer(userSettingState,
                UserSettingActions.createToggleVisibility(true, List<number>([5, 6])));
            userSettingSubject.next(userSettingState);
            urlObservable
              .pipe(
                take(1)
              )
              .subscribe(s => {
                expect(s).toContain('visible=0,5,6,8');
                expect(s).not.toContain('hidden');
            });
            userSettingState =
              userSettingReducer(userSettingState,
                UserSettingActions.createToggleVisibility(true, List<number>([3, 4])));
            userSettingSubject.next(userSettingState);
            urlObservable
              .pipe(
                take(1)
              )
              .subscribe(s => {
                expect(s).toContain('hidden=1,2,7');
                expect(s).not.toContain('visible');
            });
          });
        });
        describe('initialized with hidden columns', () => {
          beforeEach(() => {
            const params: Dictionary<string> = {
              board: 'TST&=1',
              hidden: '1,2,3'
            };
            userSettingState = userSettingReducer(initialUserSettingState, UserSettingActions.createInitialiseFromQueryString(params));
            userSettingSubject.next(userSettingState);
            urlObservable
              .pipe(
                take(1)
              )
              .subscribe(s => {
                expect(s).toContain('hidden=1,2,3');
                expect(s).not.toContain('visible');
            });
            board = BoardUtil.withMutations(initialBoardState, mutable => {
              mutable.viewId = 999;
              mutable.headers = headerState;
            });
            boardSubject.next(board);
          });

          it ('toggle visibilities', () => {
            userSettingState =
              userSettingReducer(userSettingState,
                UserSettingActions.createToggleVisibility(false, List<number>([4])));
            userSettingSubject.next(userSettingState);
            urlObservable
              .pipe(
                take(1)
              )
              .subscribe(s => {
                expect(s).toContain('hidden=1,2,3,4');
                expect(s).not.toContain('visible');
            });
            userSettingState =
              userSettingReducer(userSettingState,
                UserSettingActions.createToggleVisibility(false, List<number>([5, 6, 7])));
            userSettingSubject.next(userSettingState);
            urlObservable
              .pipe(
                take(1)
              )
              .subscribe(s => {
                expect(s).toContain('visible=0,8');
                expect(s).not.toContain('hidden');
            });
            userSettingState =
              userSettingReducer(userSettingState,
                UserSettingActions.createToggleVisibility(true, List<number>([5, 6])));
            userSettingSubject.next(userSettingState);
            urlObservable
              .pipe(
                take(1)
              )
              .subscribe(s => {
                expect(s).toContain('visible=0,5,6,8');
                expect(s).not.toContain('hidden');
            });
            userSettingState =
              userSettingReducer(userSettingState,
                UserSettingActions.createToggleVisibility(true, List<number>([3, 4])));
            userSettingSubject.next(userSettingState);
            urlObservable
              .pipe(
                take(1)
              )
              .subscribe(s => {
                expect(s).toContain('hidden=1,2,7');
                expect(s).not.toContain('visible');
            });
          });
        });
        describe('initialized with visible columns', () => {
          beforeEach(() => {
            const params: Dictionary<string> = {
              board: 'TST&=1',
              visible: '1,2,3'
            };
            userSettingState = userSettingReducer(initialUserSettingState, UserSettingActions.createInitialiseFromQueryString(params));
            userSettingSubject.next(userSettingState);
            urlObservable
              .pipe(
                take(1)
              )
              .subscribe(s => {
                expect(s).toContain('visible=1,2,3');
                expect(s).not.toContain('hidden');
            });
            board = BoardUtil.withMutations(initialBoardState, mutable => {
              mutable.viewId = 999;
              mutable.headers = headerState;
            });
            boardSubject.next(board);
          });

          it ('toggle visibilities', () => {
            userSettingState =
              userSettingReducer(userSettingState,
                UserSettingActions.createToggleVisibility(true, List<number>([4])));
            userSettingSubject.next(userSettingState);
            urlObservable
              .pipe(
                take(1)
              )
              .subscribe(s => {
                expect(s).toContain('visible=1,2,3,4');
                expect(s).not.toContain('hidden');
            });
            userSettingState =
              userSettingReducer(userSettingState,
                UserSettingActions.createToggleVisibility(true, List<number>([5, 6, 7])));
            userSettingSubject.next(userSettingState);
            urlObservable
              .pipe(
                take(1)
              )
              .subscribe(s => {
                expect(s).toContain('hidden=0,8');
                expect(s).not.toContain('visible');
            });
            userSettingState =
              userSettingReducer(userSettingState,
                UserSettingActions.createToggleVisibility(false, List<number>([5, 6])));
            userSettingSubject.next(userSettingState);
            urlObservable
              .pipe(
                take(1)
              )
              .subscribe(s => {
                expect(s).toContain('hidden=0,5,6,8');
                expect(s).not.toContain('visible');
            });
            userSettingState =
              userSettingReducer(userSettingState,
                UserSettingActions.createToggleVisibility(false, List<number>([3, 4])));
            userSettingSubject.next(userSettingState);
            urlObservable
              .pipe(
                take(1)
              )
              .subscribe(s => {
                expect(s).toContain('visible=1,2,7');
                expect(s).not.toContain('hidden');
            });
          });
        });
      });



      describe('Backlog', () => {
        let board: BoardState;
        beforeEach(() => {
          headerState = HeaderUtil.withMutations(headerState, hdr => {
            hdr.backlog = 2;
          });
          board = BoardUtil.withMutations(initialBoardState, mutable => {
            mutable.viewId = 999;
            mutable.headers = headerState;
          });
          boardSubject.next(board);
        });

        it('Toggle visiblities and Backlog', () => {
          userSettingState =
            userSettingReducer(userSettingState,
              UserSettingActions.createToggleVisibility(false, List<number>([5, 6, 7, 8])));
          userSettingSubject.next(userSettingState);
          urlObservable
            .pipe(
              take(1)
            )
            .subscribe(s => {
              expect(s).toContain('visible=2,3,4');
              expect(s).not.toContain('hidden');
          });

          userSettingState = UserSettingUtil.updateUserSettingState(userSettingState, mutable => {
            mutable.showBacklog = true;
          });
          userSettingSubject.next(userSettingState);
          urlObservable
            .pipe(
              take(1)
            )
            .subscribe(s => {
              expect(s).toContain('hidden=5,6,7,8');
              expect(s).not.toContain('visible');
          });

          userSettingState =
            userSettingReducer(userSettingState,
              UserSettingActions.createToggleVisibility(false, List<number>([2, 3, 4])));
          userSettingSubject.next(userSettingState);
          urlObservable
            .pipe(
              take(1)
            )
            .subscribe(s => {
              expect(s).toContain('visible=0,1');
              expect(s).not.toContain('hidden');
          });

          userSettingState =
            userSettingReducer(userSettingState,
              UserSettingActions.createToggleVisibility(true, List<number>([0, 1, 2, 3, 4])));
          userSettingSubject.next(userSettingState);
          urlObservable
            .pipe(
              take(1)
            )
            .subscribe(s => {
              expect(s).toContain('hidden=5,6,7,8');
              expect(s).not.toContain('visible');
          });

          userSettingState = UserSettingUtil.updateUserSettingState(userSettingState, mutable => {
            mutable.showBacklog = false;
          });
          userSettingSubject.next(userSettingState);
          urlObservable
            .pipe(
              take(1)
            )
            .subscribe(s => {
              expect(s).toContain('visible=2,3,4');
              expect(s).not.toContain('hidden');
          });
        });
      });
    });
    describe('Swimlane', () => {
      it ('Check collapsed', () => {
        userSettingState = UserSettingUtil.updateUserSettingState(userSettingState, mutable => {
          mutable.swimlane = 'component';
          mutable.defaultCollapsedSwimlane = false;
          mutable.collapsedSwimlanes = Map<string, boolean>({'a': true, 'b': true, 'c': true, 'd': false});
        });
        userSettingSubject.next(userSettingState);
        urlObservable
          .pipe(
            take(1)
          )
          .subscribe(s => {
            expect(s).toContain('hidden-sl=a,b,c');
            expect(s).not.toContain('visible-sl');
        });

        userSettingState = UserSettingUtil.updateUserSettingState(userSettingState, mutable => {
          mutable.swimlane = 'component';
          mutable.defaultCollapsedSwimlane = true;
          mutable.collapsedSwimlanes = Map<string, boolean>({'a': false, 'b': false, 'c': false, 'd': true});
        });
        userSettingSubject.next(userSettingState);
        urlObservable
          .pipe(
            take(1)
          )
          .subscribe(s => {
            expect(s).toContain('visible-sl=a,b,c');
            expect(s).not.toContain('hidden-sl');
        });

      });
    });
  });

  function userSettingStateFromQueryString(qs: string): UserSettingState {
    const dict: Dictionary<string> = parseQueryString(qs);
    return userSettingReducer(initialUserSettingState, UserSettingActions.createInitialiseFromQueryString(dict));
  }

  function parseQueryString(qs: string): Dictionary<string> {
    const dict: Dictionary<string> = {};
    return qs.split('&').reduce((map, pair) => {
      const entry: string[] = pair.split('=');
      map[entry[0]] = entry[1];
      return map;
    }, dict);
  }

});
