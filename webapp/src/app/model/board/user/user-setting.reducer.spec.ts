import {Dictionary} from '../../../common/dictionary';
import {initialUserSettingState, UserSettingState} from './user-setting.model';
import {UserSettingActions, userSettingReducer} from './user-setting.reducer';
import {FilterChecker} from './board-filter/board-filter.reducer.spec';
import {BoardFilterActions} from './board-filter/board-filter.reducer';
import {PROJECT_ATTRIBUTES} from './board-filter/board-filter.constants';

describe('User setting reducer tests', () => {
  describe('Querystring tests', () => {
    it('No querystring', () => {
      const qs: Dictionary<string> = {};
      const state: UserSettingState = userSettingReducer(
        initialUserSettingState,
        UserSettingActions.createInitialiseFromQueryString(qs));
      expect(state).toBe(initialUserSettingState);
    });

    it ('With Querystring', () => {
      // Just test a few filter fields, the board filter reducer tests test this properly
      const qs: Dictionary<string> = {
        project: 'P1',
        swimlane: 'project'
      };
      const state: UserSettingState = userSettingReducer(
        initialUserSettingState,
        UserSettingActions.createInitialiseFromQueryString(qs));
      const settingChecker: SettingChecker = new SettingChecker();
      settingChecker.swimlane = 'project';
      settingChecker.filterChecker.project = ['P1'];
      settingChecker.check(state)
    });
  });

  describe('Update tests', () => {
    let state: UserSettingState
    beforeEach(() => {
      const qs: Dictionary<string> = {
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
      checker.filterChecker.project = ['P2', 'P3'];
      checker.check(state);
    });

    it ('Update swimlane', () => {
      state = userSettingReducer(state, UserSettingActions.createUpdateSwimlane('project'));
      const checker: SettingChecker = new SettingChecker();
      checker.swimlane = 'project';
      checker.check(state);
    });
  });
});

class SettingChecker {
  swimlane: string = null;
  filterChecker: FilterChecker = new FilterChecker();

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
    if (!this.swimlane) {
      expect(state.swimlane).toBeFalsy();
    } else {
      expect(state.swimlane).toEqual(this.swimlane);
    }
    this.filterChecker.check(state.filters);
  }
}
