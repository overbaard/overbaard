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
        project: 'P1'
      };
      const state: UserSettingState = userSettingReducer(
        initialUserSettingState,
        UserSettingActions.createInitialiseFromQueryString(qs));
      const settingChecker: SettingChecker = new SettingChecker();
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
  });
});

class SettingChecker {
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
    this.filterChecker.check(state.filters);
  }
}
