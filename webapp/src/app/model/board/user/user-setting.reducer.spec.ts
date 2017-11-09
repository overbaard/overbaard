import {Dictionary} from '../../../common/dictionary';
import {initialUserSettingState, UserSettingState} from './user-setting.model';
import {UserSettingActions, userSettingReducer} from './user-setting.reducer';
import {FilterChecker} from './board-filter/board-filter.reducer.spec';
import {BoardFilterActions} from './board-filter/board-filter.reducer';
import {PROJECT_ATTRIBUTES} from './board-filter/board-filter.constants';
import {List} from 'immutable';

describe('User setting reducer tests', () => {
  describe('Querystring tests', () => {
    it ('With Querystring, no backlog or column visibilties', () => {
      // Just test a few filter fields, the board filter reducer tests test this properly
      const qs: Dictionary<string> = {
        board: 'TEST',
        project: 'P1',
        swimlane: 'project'
      };
      const state: UserSettingState = userSettingReducer(
        initialUserSettingState,
        UserSettingActions.createInitialiseFromQueryString(qs));
      const settingChecker: SettingChecker = new SettingChecker();
      settingChecker.boardCode = 'TEST';
      settingChecker.swimlane = 'project';
      settingChecker.filterChecker.project = ['P1'];
      settingChecker.check(state)
    });
    it ('With Querystring, bl=false and visible columns', () => {
      // Just test a few filter fields, the board filter reducer tests test this properly
      const qs: Dictionary<string> = {
        board: 'TEST',
        bl: 'false',
        project: 'P1',
        swimlane: 'project',
        visible: '1,5,7'
      };
      const state: UserSettingState = userSettingReducer(
        initialUserSettingState,
        UserSettingActions.createInitialiseFromQueryString(qs));
      const settingChecker: SettingChecker = new SettingChecker();
      settingChecker.boardCode = 'TEST';
      settingChecker.swimlane = 'project';
      settingChecker.filterChecker.project = ['P1'];
      settingChecker.visibleColumns = {1: true, 5: true, 7: true}
      settingChecker.defaultColumnVisibility = false;
      settingChecker.check(state)
    });
    it ('With Querystring, bl=true and hidden columns', () => {
      // Just test a few filter fields, the board filter reducer tests test this properly
      const qs: Dictionary<string> = {
        board: 'TEST',
        bl: 'true',
        project: 'P1',
        swimlane: 'project',
        hidden: '2,6,8'
      };
      const state: UserSettingState = userSettingReducer(
        initialUserSettingState,
        UserSettingActions.createInitialiseFromQueryString(qs));
      const settingChecker: SettingChecker = new SettingChecker();
      settingChecker.boardCode = 'TEST';
      settingChecker.backlog = true;
      settingChecker.swimlane = 'project';
      settingChecker.filterChecker.project = ['P1'];
      settingChecker.visibleColumns = {2: false, 6: false, 8: false}
      settingChecker.check(state)
    });
  });

  describe('Update tests', () => {
    let state: UserSettingState
    beforeEach(() => {
      const qs: Dictionary<string> = {
        board: 'TEST',
        project: 'P1'
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

    it ('Update swimlane', () => {
      state = userSettingReducer(state, UserSettingActions.createUpdateSwimlane('project'));
      const checker: SettingChecker = new SettingChecker();
      checker.boardCode = 'TEST';
      checker.swimlane = 'project';
      checker.check(state);
    });
  });

  describe('Toggle column visibility', () => {
    describe('Single state', () => {
      it ('No visibilities columns', () => {
        const qs: Dictionary<string> = {
          board: 'TEST',
          project: 'P1'
        };
        let state: UserSettingState = userSettingReducer(
          initialUserSettingState,
          UserSettingActions.createInitialiseFromQueryString(qs));
        const checker: SettingChecker = new SettingChecker();
        checker.boardCode = 'TEST';
        checker.check(state);

        state = userSettingReducer(state, UserSettingActions.toggleVisibility(List<number>([1])));
        checker.visibleColumns = {1: false};
        checker.check(state);

        state = userSettingReducer(state, UserSettingActions.toggleVisibility(List<number>([1])));
        checker.visibleColumns = {1: true};
        checker.check(state);

        state = userSettingReducer(state, UserSettingActions.toggleVisibility(List<number>([2])));
        checker.visibleColumns = {1: true, 2: false};
        checker.check(state);
      });

      it ('Hidden columns', () => {
        const qs: Dictionary<string> = {
          board: 'TEST',
          project: 'P1',
          hidden: '1'
        };
        let state: UserSettingState = userSettingReducer(
          initialUserSettingState,
          UserSettingActions.createInitialiseFromQueryString(qs));
        const checker: SettingChecker = new SettingChecker();
        checker.boardCode = 'TEST';
        checker.visibleColumns = {1: false};
        checker.check(state);

        state = userSettingReducer(state, UserSettingActions.toggleVisibility(List<number>([1])));
        checker.visibleColumns = {1: true};
        checker.check(state);

        state = userSettingReducer(state, UserSettingActions.toggleVisibility(List<number>([1])));
        checker.visibleColumns = {1: false};
        checker.check(state);

        state = userSettingReducer(state, UserSettingActions.toggleVisibility(List<number>([2])));
        checker.visibleColumns = {1: false, 2: false};
        checker.check(state);
      });

      it ('Visible columns', () => {
        const qs: Dictionary<string> = {
          board: 'TEST',
          project: 'P1',
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

        state = userSettingReducer(state, UserSettingActions.toggleVisibility(List<number>([1])));
        checker.visibleColumns = {1: false};
        checker.check(state);

        state = userSettingReducer(state, UserSettingActions.toggleVisibility(List<number>([1])));
        checker.visibleColumns = {1: true};
        checker.check(state);

        state = userSettingReducer(state, UserSettingActions.toggleVisibility(List<number>([2])));
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
          board: 'TEST',
          project: 'P1'
        };
        let state: UserSettingState = userSettingReducer(
          initialUserSettingState,
          UserSettingActions.createInitialiseFromQueryString(qs));
        const checker: SettingChecker = new SettingChecker();
        checker.boardCode = 'TEST';
        checker.check(state);

        // Toggle all of them
        state = userSettingReducer(state, UserSettingActions.toggleVisibility(categoryStates));
        checker.visibleColumns = {1: false, 2: false, 3: false};
        checker.check(state);

        // Set one to true, and then when toggling the header all should be false again
        state = userSettingReducer(state, UserSettingActions.toggleVisibility(List<number>([1])));
        checker.visibleColumns = {1: true, 2: false, 3: false};
        checker.check(state);

        state = userSettingReducer(state, UserSettingActions.toggleVisibility(categoryStates));
        checker.visibleColumns = {1: false, 2: false, 3: false};
        checker.check(state);

        state = userSettingReducer(state, UserSettingActions.toggleVisibility(categoryStates));
        checker.visibleColumns = {1: true, 2: true, 3: true};
        checker.check(state);
      });

      it ('Hidden', () => {
        const qs: Dictionary<string> = {
          board: 'TEST',
          project: 'P1',
          hidden: '1'
        };
        let state: UserSettingState = userSettingReducer(
          initialUserSettingState,
          UserSettingActions.createInitialiseFromQueryString(qs));
        const checker: SettingChecker = new SettingChecker();
        checker.boardCode = 'TEST';
        checker.visibleColumns = {1: false};
        checker.check(state);

        state = userSettingReducer(state, UserSettingActions.toggleVisibility(List<number>([3])));
        checker.visibleColumns = {1: false, 3: false};
        checker.check(state);

        state = userSettingReducer(state, UserSettingActions.toggleVisibility(categoryStates));
        checker.visibleColumns = {1: false, 2: false, 3: false};
        checker.check(state);

        state = userSettingReducer(state, UserSettingActions.toggleVisibility(List<number>([3])));
        checker.visibleColumns = {1: false, 2: false, 3: true};
        checker.check(state);

        state = userSettingReducer(state, UserSettingActions.toggleVisibility(categoryStates));
        checker.visibleColumns = {1: false, 2: false, 3: false};
        checker.check(state);

        state = userSettingReducer(state, UserSettingActions.toggleVisibility(categoryStates));
        checker.visibleColumns = {1: true, 2: true, 3: true};
        checker.check(state);
      });


      it ('Visible', () => {
        const qs: Dictionary<string> = {
          board: 'TEST',
          project: 'P1',
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

        state = userSettingReducer(state, UserSettingActions.toggleVisibility(List<number>([3])));
        checker.visibleColumns = {1: true, 3: true};
        checker.check(state);

        state = userSettingReducer(state, UserSettingActions.toggleVisibility(categoryStates));
        checker.visibleColumns = {1: false, 2: false, 3: false};
        checker.check(state);

        state = userSettingReducer(state, UserSettingActions.toggleVisibility(List<number>([3])));
        checker.visibleColumns = {1: false, 2: false, 3: true};
        checker.check(state);

        state = userSettingReducer(state, UserSettingActions.toggleVisibility(categoryStates));
        checker.visibleColumns = {1: false, 2: false, 3: false};
        checker.check(state);

        state = userSettingReducer(state, UserSettingActions.toggleVisibility(categoryStates));
        checker.visibleColumns = {1: true, 2: true, 3: true};
        checker.check(state);
      })
    });
  });
});

class SettingChecker {
  boardCode: string = null;
  backlog = false;
  swimlane: string = null;
  filterChecker: FilterChecker = new FilterChecker();
  defaultColumnVisibility = true;
  visibleColumns: any;

  constructor() {
    for (const key of Object.keys(this.filterChecker)) {
      if (key === 'customField' || key === 'parallelTask') {
        this.filterChecker[key] = {};
      } else {
        this.filterChecker[key] = [];
      }
    }
    this.filterChecker.project = ['P1'];
  }

  check(state: UserSettingState) {
    expect(this.boardCode).toEqual(state.boardCode);
    expect(this.backlog).toEqual(state.backlog);
    if (!this.swimlane) {
      expect(state.swimlane).toBeFalsy();
    } else {
      expect(state.swimlane).toEqual(this.swimlane);
    }
    this.filterChecker.check(state.filters);
    expect(state.defaultColumnVisibility).toBe(this.defaultColumnVisibility);
    if (!this.visibleColumns) {
      expect(state.columnVisibilities.size).toBe(0);
    } else {
      expect(state.columnVisibilities.toObject()).toEqual(this.visibleColumns);
    }
  }
}
