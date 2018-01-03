import {Dictionary} from '../../../common/dictionary';
import {initialUserSettingState} from './user-setting.model';
import {UserSettingActions, userSettingReducer} from './user-setting.reducer';
import {FilterChecker} from './board-filter/board-filter.reducer.spec';
import {BoardFilterActions} from './board-filter/board-filter.reducer';
import {PROJECT_ATTRIBUTES} from './board-filter/board-filter.constants';
import {List} from 'immutable';
import {UserSettingState} from './user-setting';
import {BoardViewMode} from './board-view-mode';
import {BoardHeader} from '../../../view-model/board/board-header';
import {IssueSummaryLevel} from './issue-summary-level';

describe('User setting reducer tests', () => {
  describe('Querystring tests', () => {
    it ('Simple', () => {
      // Just test a few filter fields, the board filter reducer tests test this properly
      const qs: Dictionary<string> = {
        board: 'TEST'
      };
      const state: UserSettingState = userSettingReducer(
        initialUserSettingState,
        UserSettingActions.createInitialiseFromQueryString(qs));
      const settingChecker: SettingChecker = new SettingChecker();
      settingChecker.boardCode = 'TEST';
      settingChecker.check(state)
    });
    it ('Swimlane and project filter', () => {
      // Just test a few filter fields, the board filter reducer tests test this properly
      const qs: Dictionary<string> = {
        board: 'TEST',
        project: 'P1',
        swimlane: 'assignee',
        'isl': '0',
        'vpt': 'true'
      };
      const state: UserSettingState = userSettingReducer(
        initialUserSettingState,
        UserSettingActions.createInitialiseFromQueryString(qs));
      const settingChecker: SettingChecker = new SettingChecker();
      settingChecker.boardCode = 'TEST';
      settingChecker.filterChecker.project = ['P1'];
      settingChecker.swimlane = 'assignee';
      settingChecker.issueSummaryLevel = IssueSummaryLevel.HEADER_ONLY;
      settingChecker.check(state)
    });
    it ('With Querystring, bl=false and visible columns', () => {
      // Just test a few filter fields, the board filter reducer tests test this properly
      const qs: Dictionary<string> = {
        board: 'TEST',
        bl: 'false',
        project: 'P1',
        swimlane: 'project',
        showEmptySl: 'true',
        visible: '1,5,7',
        'visible-sl': 'a,b,c',
        'isl': '1',
        'vpt': 'false'
      };
      const state: UserSettingState = userSettingReducer(
        initialUserSettingState,
        UserSettingActions.createInitialiseFromQueryString(qs));
      const settingChecker: SettingChecker = new SettingChecker();
      settingChecker.boardCode = 'TEST';
      settingChecker.swimlane = 'project';
      settingChecker.showEmptySwimlane = true;
      settingChecker.filterChecker.project = ['P1'];
      settingChecker.visibleColumns = {1: true, 5: true, 7: true};
      settingChecker.defaultColumnVisibility = false;
      settingChecker.collapsedSwimlanes = {a: false, b: false, c: false};
      settingChecker.defaultSwimlaneCollapsed = true;
      settingChecker.issueSummaryLevel = IssueSummaryLevel.SHORT_SUMMARY_NO_AVATAR;
      settingChecker.parallelTasks = false;
      settingChecker.check(state)
    });
    it ('With Querystring, bl=true and hidden columns', () => {
      // Just test a few filter fields, the board filter reducer tests test this properly
      const qs: Dictionary<string> = {
        board: 'TEST',
        bl: 'true',
        project: 'P1',
        swimlane: 'project',
        showEmptySl: 'false',
        hidden: '2,6,8',
        'hidden-sl': 'd,e,f',
        'isl': '2'
      };
      const state: UserSettingState = userSettingReducer(
        initialUserSettingState,
        UserSettingActions.createInitialiseFromQueryString(qs));
      const settingChecker: SettingChecker = new SettingChecker();
      settingChecker.boardCode = 'TEST';
      settingChecker.showBacklog = true;
      settingChecker.swimlane = 'project';
      settingChecker.filterChecker.project = ['P1'];
      settingChecker.visibleColumns = {2: false, 6: false, 8: false}
      settingChecker.collapsedSwimlanes = {d: true, e: true, f: true};
      settingChecker.defaultSwimlaneCollapsed = false;
      settingChecker.issueSummaryLevel = IssueSummaryLevel.SHORT_SUMMARY;

      settingChecker.check(state)
    });
  });

  describe('Update tests', () => {
    let state: UserSettingState
    beforeEach(() => {
      const qs: Dictionary<string> = {
        board: 'TEST'
      };
      state = userSettingReducer(
        initialUserSettingState,
        UserSettingActions.createInitialiseFromQueryString(qs));
    });

    it ('Update filter', () => {
      // Just test a few filter fields, the board filter reducer tests test this properly
      state = userSettingReducer(state, BoardFilterActions.createUpdateFilter(PROJECT_ATTRIBUTES, {P1: false, P2: true, P3: true}));
      const checker: SettingChecker = new SettingChecker();
      checker.boardCode = 'TEST';
      checker.filterChecker.project = ['P2', 'P3'];
      checker.check(state);
    });

    it ('Update issue summary level', () => {
      state = userSettingReducer(state, UserSettingActions.createUpdateIssueSummaryLevel(IssueSummaryLevel.SHORT_SUMMARY_NO_AVATAR));
      const checker: SettingChecker = new SettingChecker();
      checker.boardCode = 'TEST';
      checker.issueSummaryLevel = IssueSummaryLevel.SHORT_SUMMARY_NO_AVATAR;
      checker.check(state);
    });

    it ('Update show parallel tasks', () => {
      state = userSettingReducer(state, UserSettingActions.createUpdateShowParallelTasks(false));
      const checker: SettingChecker = new SettingChecker();
      checker.boardCode = 'TEST';
      checker.parallelTasks = false;
      checker.check(state);

      state = userSettingReducer(state, UserSettingActions.createUpdateShowParallelTasks(true));
      checker.parallelTasks = true;
      checker.check(state);
    });

    it ('Update swimlane', () => {
      state = userSettingReducer(state, UserSettingActions.createUpdateSwimlane('project'));
      const checker: SettingChecker = new SettingChecker();
      checker.boardCode = 'TEST';
      checker.swimlane = 'project';
      checker.check(state);
    });

    it ('Update show empty swimlanes', () => {
      // showEmpty is ignored until happen until we have set a swimlane
      state = userSettingReducer(state, UserSettingActions.createToggleShowEmptySwimlanes());
      const checker: SettingChecker = new SettingChecker();
      checker.boardCode = 'TEST';
      checker.check(state);

      state = userSettingReducer(state, UserSettingActions.createUpdateSwimlane('project'));
      checker.swimlane = 'project';
      checker.check(state);

      state = userSettingReducer(state, UserSettingActions.createToggleShowEmptySwimlanes());
      checker.showEmptySwimlane = true;
      checker.check(state);

      // Noop re showEmpty
      state = userSettingReducer(state, UserSettingActions.createUpdateSwimlane('project'));

      // Changing a swimlane should reset showEmpty to false
      state = userSettingReducer(state, UserSettingActions.createUpdateSwimlane('assignee'));
      checker.swimlane = 'assignee';
      checker.showEmptySwimlane = false;
      checker.check(state);

      state = userSettingReducer(state, UserSettingActions.createToggleShowEmptySwimlanes());
      checker.showEmptySwimlane = true;
      checker.check(state);

      state = userSettingReducer(state, UserSettingActions.createUpdateSwimlane(null));
      checker.swimlane = null;
      checker.showEmptySwimlane = false;
      checker.check(state);
    });
  });

  describe('Toggle column visibility', () => {
    describe('Single state', () => {
      it ('Default visibilities', () => {
        const qs: Dictionary<string> = {
          board: 'TEST'
        };
        let state: UserSettingState = userSettingReducer(
          initialUserSettingState,
          UserSettingActions.createInitialiseFromQueryString(qs));
        const checker: SettingChecker = new SettingChecker();
        checker.boardCode = 'TEST';
        checker.check(state);

        state = userSettingReducer(state, UserSettingActions.createToggleVisibility(false, List<number>([1])));
        checker.visibleColumns = {1: false};
        checker.check(state);

        state = userSettingReducer(state, UserSettingActions.createToggleVisibility(true, List<number>([1])));
        checker.visibleColumns = {1: true};
        checker.check(state);

        state = userSettingReducer(state, UserSettingActions.createToggleVisibility(false, List<number>([2])));
        checker.visibleColumns = {1: true, 2: false};
        checker.check(state);
      });

      it ('Hidden columns', () => {
        const qs: Dictionary<string> = {
          board: 'TEST',
          hidden: '1'
        };
        let state: UserSettingState = userSettingReducer(
          initialUserSettingState,
          UserSettingActions.createInitialiseFromQueryString(qs));
        const checker: SettingChecker = new SettingChecker();
        checker.boardCode = 'TEST';
        checker.visibleColumns = {1: false};
        checker.check(state);

        state = userSettingReducer(state, UserSettingActions.createToggleVisibility(true, List<number>([1])));
        checker.visibleColumns = {1: true};
        checker.check(state);

        state = userSettingReducer(state, UserSettingActions.createToggleVisibility(false, List<number>([1])));
        checker.visibleColumns = {1: false};
        checker.check(state);

        state = userSettingReducer(state, UserSettingActions.createToggleVisibility(false, List<number>([2])));
        checker.visibleColumns = {1: false, 2: false};
        checker.check(state);
      });

      it ('Visible columns', () => {
        const qs: Dictionary<string> = {
          board: 'TEST',
          visible: '1'
        };
        let state: UserSettingState = userSettingReducer(
          initialUserSettingState,
          UserSettingActions.createInitialiseFromQueryString(qs));
        const checker: SettingChecker = new SettingChecker();
        checker.boardCode = 'TEST';
        checker.defaultColumnVisibility = false;
        checker.visibleColumns = {1: true};
        checker.check(state);

        state = userSettingReducer(state, UserSettingActions.createToggleVisibility(false, List<number>([1])));
        checker.visibleColumns = {1: false};
        checker.check(state);

        state = userSettingReducer(state, UserSettingActions.createToggleVisibility(true, List<number>([1])));
        checker.visibleColumns = {1: true};
        checker.check(state);

        state = userSettingReducer(state, UserSettingActions.createToggleVisibility(true, List<number>([2])));
        checker.visibleColumns = {1: true, 2: true};
        checker.check(state);
      });
    });

    describe('Category and children', () => {
      // When toggling a category, we basically toggle the visibilities of all the child states, and this is handled by the reducer
      // Do some checks here to make sure that it is all handled properly
      const categoryStates: List<number> = List<number>([1, 2, 3]);
      it ('No visiblities', () => {
        const qs: Dictionary<string> = {
          board: 'TEST'
        };
        let state: UserSettingState = userSettingReducer(
          initialUserSettingState,
          UserSettingActions.createInitialiseFromQueryString(qs));
        const checker: SettingChecker = new SettingChecker();
        checker.boardCode = 'TEST';
        checker.check(state);

        // Toggle all of them
        state = userSettingReducer(state, UserSettingActions.createToggleVisibility(false, categoryStates));
        checker.visibleColumns = {1: false, 2: false, 3: false};
        checker.check(state);

        // Set one to true, and then when toggling the header all should be false again
        state = userSettingReducer(state, UserSettingActions.createToggleVisibility(true, List<number>([1])));
        checker.visibleColumns = {1: true, 2: false, 3: false};
        checker.check(state);

        state = userSettingReducer(state, UserSettingActions.createToggleVisibility(false, categoryStates));
        checker.visibleColumns = {1: false, 2: false, 3: false};
        checker.check(state);

        state = userSettingReducer(state, UserSettingActions.createToggleVisibility(true, categoryStates));
        checker.visibleColumns = {1: true, 2: true, 3: true};
        checker.check(state);
      });

      it ('Hidden', () => {
        const qs: Dictionary<string> = {
          board: 'TEST',
          hidden: '1'
        };
        let state: UserSettingState = userSettingReducer(
          initialUserSettingState,
          UserSettingActions.createInitialiseFromQueryString(qs));
        const checker: SettingChecker = new SettingChecker();
        checker.boardCode = 'TEST';
        checker.visibleColumns = {1: false};
        checker.check(state);

        state = userSettingReducer(state, UserSettingActions.createToggleVisibility(false, List<number>([3])));
        checker.visibleColumns = {1: false, 3: false};
        checker.check(state);

        state = userSettingReducer(state, UserSettingActions.createToggleVisibility(false, categoryStates));
        checker.visibleColumns = {1: false, 2: false, 3: false};
        checker.check(state);

        state = userSettingReducer(state, UserSettingActions.createToggleVisibility(true, List<number>([3])));
        checker.visibleColumns = {1: false, 2: false, 3: true};
        checker.check(state);

        state = userSettingReducer(state, UserSettingActions.createToggleVisibility(false, categoryStates));
        checker.visibleColumns = {1: false, 2: false, 3: false};
        checker.check(state);

        state = userSettingReducer(state, UserSettingActions.createToggleVisibility(true, categoryStates));
        checker.visibleColumns = {1: true, 2: true, 3: true};
        checker.check(state);
      });


      it ('Visible', () => {
        const qs: Dictionary<string> = {
          board: 'TEST',
          visible: '1'
        };
        let state: UserSettingState = userSettingReducer(
          initialUserSettingState,
          UserSettingActions.createInitialiseFromQueryString(qs));
        const checker: SettingChecker = new SettingChecker();
        checker.boardCode = 'TEST';
        checker.visibleColumns = {1: true};
        checker.defaultColumnVisibility = false;
        checker.check(state);

        state = userSettingReducer(state, UserSettingActions.createToggleVisibility(true, List<number>([3])));
        checker.visibleColumns = {1: true, 3: true};
        checker.check(state);

        state = userSettingReducer(state, UserSettingActions.createToggleVisibility(false, categoryStates));
        checker.visibleColumns = {1: false, 2: false, 3: false};
        checker.check(state);

        state = userSettingReducer(state, UserSettingActions.createToggleVisibility(true, List<number>([3])));
        checker.visibleColumns = {1: false, 2: false, 3: true};
        checker.check(state);

        state = userSettingReducer(state, UserSettingActions.createToggleVisibility(false, categoryStates));
        checker.visibleColumns = {1: false, 2: false, 3: false};
        checker.check(state);

        state = userSettingReducer(state, UserSettingActions.createToggleVisibility(true, categoryStates));
        checker.visibleColumns = {1: true, 2: true, 3: true};
        checker.check(state);
      });
    });
  });

  describe('Toggle collapsed swimlane', () => {
    it('Default visibilities', () => {
      const qs: Dictionary<string> = {
        board: 'TEST',
        swimlane: 'project'
      };
      let state: UserSettingState = userSettingReducer(
        initialUserSettingState,
        UserSettingActions.createInitialiseFromQueryString(qs));
      const checker: SettingChecker = new SettingChecker();
      checker.boardCode = 'TEST';
      checker.swimlane = 'project';
      checker.check(state);

      state = userSettingReducer(state, UserSettingActions.createToggleCollapsedSwimlane('a'));
      checker.collapsedSwimlanes = {a: true};
      checker.check(state);

      state = userSettingReducer(state, UserSettingActions.createToggleCollapsedSwimlane('a'));
      checker.collapsedSwimlanes = {a: false};
      checker.check(state);

      state = userSettingReducer(state, UserSettingActions.createToggleCollapsedSwimlane('b'));
      checker.collapsedSwimlanes = {a: false, b: true};
      checker.check(state);

      // Check that the collapsed info is reset to its defaults when we change the swimlane
      state = userSettingReducer(state, UserSettingActions.createUpdateSwimlane(null));
      checker.swimlane = null;
      checker.collapsedSwimlanes = {};
      checker.check(state);
    });

    it('Hidden swimlanes', () => {
      const qs: Dictionary<string> = {
        board: 'TEST',
        swimlane: 'project',
        'hidden-sl': 'a'
      };
      let state: UserSettingState = userSettingReducer(
        initialUserSettingState,
        UserSettingActions.createInitialiseFromQueryString(qs));
      const checker: SettingChecker = new SettingChecker();
      checker.boardCode = 'TEST';
      checker.swimlane = 'project';
      checker.collapsedSwimlanes = {a: true};
      checker.check(state);

      state = userSettingReducer(state, UserSettingActions.createToggleCollapsedSwimlane('a'));
      checker.collapsedSwimlanes = {a: false};
      checker.check(state);

      state = userSettingReducer(state, UserSettingActions.createToggleCollapsedSwimlane('a'));
      checker.collapsedSwimlanes = {a: true};
      checker.check(state);

      state = userSettingReducer(state, UserSettingActions.createToggleCollapsedSwimlane('b'));
      checker.collapsedSwimlanes = {a: true, b: true};
      checker.check(state);

      // Check that the collapsed info is reset to its defaults when we change the swimlane
      state = userSettingReducer(state, UserSettingActions.createUpdateSwimlane('assignee'));
      checker.swimlane = 'assignee';
      checker.collapsedSwimlanes = {};
      checker.check(state);
    });
    it('Visible swimlanes', () => {
      const qs: Dictionary<string> = {
        board: 'TEST',
        swimlane: 'project',
        'visible-sl': 'a'
      };
      let state: UserSettingState = userSettingReducer(
        initialUserSettingState,
        UserSettingActions.createInitialiseFromQueryString(qs));
      const checker: SettingChecker = new SettingChecker();
      checker.boardCode = 'TEST';
      checker.swimlane = 'project';
      checker.defaultSwimlaneCollapsed = true;
      checker.collapsedSwimlanes = {a: false};
      checker.check(state);

      state = userSettingReducer(state, UserSettingActions.createToggleCollapsedSwimlane('a'));
      checker.collapsedSwimlanes = {a: true};
      checker.check(state);

      state = userSettingReducer(state, UserSettingActions.createToggleCollapsedSwimlane('a'));
      checker.collapsedSwimlanes = {a: false};
      checker.check(state);

      state = userSettingReducer(state, UserSettingActions.createToggleCollapsedSwimlane('b'));
      checker.collapsedSwimlanes = {a: false, b: false};
      checker.check(state);

      // Check that the collapsed info is reset to its defaults when we change the swimlane
      state = userSettingReducer(state, UserSettingActions.createUpdateSwimlane(null));
      checker.swimlane = null;
      checker.collapsedSwimlanes = {};
      checker.defaultSwimlaneCollapsed = false;
      checker.check(state);
    });
  });

  describe('Backlog and view mode tests', () => {
    it ('Initial rank view', () => {
      const qs: Dictionary<string> = {
        board: 'TEST',
        view: 'rv'
      };
      let state: UserSettingState = userSettingReducer(
        initialUserSettingState,
        UserSettingActions.createInitialiseFromQueryString(qs));
      const checker: SettingChecker = new SettingChecker();
      checker.boardCode = 'TEST';
      checker.viewMode = BoardViewMode.RANK;
      checker.showBacklog = true;
      checker.forceBacklog = true;
      checker.check(state);

      state = userSettingReducer(state, UserSettingActions.createSwitchBoardViewAction());
      checker.viewMode = BoardViewMode.KANBAN;
      checker.showBacklog = false;
      checker.forceBacklog = false;
      checker.check(state);
    });

    describe('Initial Kanban view', () => {
      describe('Backlog initially hidden', () => {
        it ('Switch view', () => {
          const qs: Dictionary<string> = {
            board: 'TEST'
          };
          let state: UserSettingState = userSettingReducer(
            initialUserSettingState,
            UserSettingActions.createInitialiseFromQueryString(qs));
          const checker: SettingChecker = new SettingChecker();
          checker.boardCode = 'TEST';
          checker.check(state);

          state = userSettingReducer(state, UserSettingActions.createSwitchBoardViewAction());
          checker.viewMode = BoardViewMode.RANK;
          checker.showBacklog = true;
          checker.forceBacklog = true;
          checker.check(state);

          state = userSettingReducer(state, UserSettingActions.createSwitchBoardViewAction());
          checker.viewMode = BoardViewMode.KANBAN;
          checker.showBacklog = false;
          checker.forceBacklog = false;
          checker.check(state);
        });

        it ('Toggle backlog', () => {
          const qs: Dictionary<string> = {
            board: 'TEST'
          };
          let state: UserSettingState = userSettingReducer(
            initialUserSettingState,
            UserSettingActions.createInitialiseFromQueryString(qs));
          const checker: SettingChecker = new SettingChecker();
          checker.boardCode = 'TEST';
          checker.check(state);

          state = userSettingReducer(state, UserSettingActions.createToggleBacklog(getBacklogHeaderForToggle()));
          checker.showBacklog = true;
          checker.visibleColumns = {0: true};
          checker.check(state);

          state = userSettingReducer(state, UserSettingActions.createToggleBacklog(getBacklogHeaderForToggle()));
          checker.showBacklog = false;
          checker.visibleColumns = {0: false};
          checker.check(state);
        });
      });

      describe('Backlog initially visible', () => {
        it ('Switch view', () => {
          const qs: Dictionary<string> = {
            board: 'TEST',
            bl: 'true'
          };
          let state: UserSettingState = userSettingReducer(
            initialUserSettingState,
            UserSettingActions.createInitialiseFromQueryString(qs));
          const checker: SettingChecker = new SettingChecker();
          checker.boardCode = 'TEST';
          checker.showBacklog = true;
          checker.check(state);

          state = userSettingReducer(state, UserSettingActions.createSwitchBoardViewAction());
          checker.viewMode = BoardViewMode.RANK;
          checker.check(state);

          state = userSettingReducer(state, UserSettingActions.createSwitchBoardViewAction());
          checker.viewMode = BoardViewMode.KANBAN;
          checker.check(state);
        });

        it ('Toggle backlog', () => {
          const qs: Dictionary<string> = {
            board: 'TEST',
            bl: 'true'
          };
          let state: UserSettingState = userSettingReducer(
            initialUserSettingState,
            UserSettingActions.createInitialiseFromQueryString(qs));
          const checker: SettingChecker = new SettingChecker();
          checker.boardCode = 'TEST';
          checker.showBacklog = true;
          checker.check(state);

          state = userSettingReducer(state, UserSettingActions.createToggleBacklog(getBacklogHeaderForToggle()));
          checker.showBacklog = false;
          checker.visibleColumns = {0: false};
          checker.check(state);

          state = userSettingReducer(state, UserSettingActions.createToggleBacklog(getBacklogHeaderForToggle()));
          checker.showBacklog = true;
          checker.visibleColumns = {0: true
          };
          checker.check(state);
        });
      });
      function getBacklogHeaderForToggle(): BoardHeader {
        // Only the stateIndices are used for what we are testing here
        return {
          name: 'Backlog',
          abbreviation: 'BL',
          category: true,
          backlog: true,
          wip: 0,
          totalIssues: 0,
          visibleIssues: 0,
          visible: true,
          states: List<BoardHeader>(),
          stateIndices: List<number>([0]),
          helpText: null
        };
      }
    })
  });
});

class SettingChecker {
  boardCode: string = null;
  viewMode: BoardViewMode = BoardViewMode.KANBAN;
  showBacklog = false;
  forceBacklog = false;
  swimlane: string = null;
  filterChecker: FilterChecker = new FilterChecker();
  defaultColumnVisibility = true;
  visibleColumns: any;
  showEmptySwimlane = false;
  defaultSwimlaneCollapsed = false;
  collapsedSwimlanes: any;
  issueSummaryLevel: IssueSummaryLevel = IssueSummaryLevel.FULL;
  parallelTasks = true;

  constructor() {
    for (const key of Object.keys(this.filterChecker)) {
      if (key === 'customField' || key === 'parallelTask') {
        this.filterChecker[key] = {};
      } else {
        this.filterChecker[key] = [];
      }
    }
  }

  check(state: UserSettingState) {
    expect(state.boardCode).toEqual(this.boardCode);
    expect(state.showBacklog).toEqual(this.showBacklog);
    expect(state.forceBacklog).toEqual(this.forceBacklog)
    if (!this.swimlane) {
      expect(state.swimlane).toBeFalsy();
    } else {
      expect(state.swimlane).toEqual(this.swimlane);
    }
    expect(state.swimlaneShowEmpty).toEqual(this.showEmptySwimlane);
    this.filterChecker.check(state.filters);
    expect(state.defaultColumnVisibility).toBe(this.defaultColumnVisibility);
    if (!this.visibleColumns) {
      expect(state.columnVisibilities.size).toBe(0);
    } else {
      expect(state.columnVisibilities.toObject()).toEqual(this.visibleColumns);
    }
    expect(state.defaultCollapsedSwimlane).toBe(this.defaultSwimlaneCollapsed);
    if (!this.collapsedSwimlanes) {
      expect(state.collapsedSwimlanes.size).toBe(0);
    } else {
      expect(state.collapsedSwimlanes.toObject()).toEqual(this.collapsedSwimlanes);
    }
    expect(state.issueDetail.issueSummaryLevel).toBe(this.issueSummaryLevel);
    expect(state.issueDetail.parallelTasks).toBe(this.parallelTasks);
  }
}
