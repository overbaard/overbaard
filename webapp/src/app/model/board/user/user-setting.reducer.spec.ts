import {Dictionary} from '../../../common/dictionary';
import {initialUserSettingState, UserSettingState} from './user-setting.model';
import {UserSettingActions, userSettingReducer} from './user-setting.reducer';
import {FilterChecker} from './board-filter/board-filter.reducer.spec';
import {BoardFilterActions} from './board-filter/board-filter.reducer';
import {PROJECT_ATTRIBUTES} from './board-filter/board-filter.constants';

describe('User setting reducer tests', () => {
  describe('Querystring tests', () => {
    it ('With Querystring, no backlog', () => {
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
    it ('With Querystring, bl=false', () => {
      // Just test a few filter fields, the board filter reducer tests test this properly
      const qs: Dictionary<string> = {
        board: 'TEST',
        bl: 'false',
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
    it ('With Querystring, bl=true', () => {
      // Just test a few filter fields, the board filter reducer tests test this properly
      const qs: Dictionary<string> = {
        board: 'TEST',
        bl: 'true',
        project: 'P1',
        swimlane: 'project'
      };
      const state: UserSettingState = userSettingReducer(
        initialUserSettingState,
        UserSettingActions.createInitialiseFromQueryString(qs));
      const settingChecker: SettingChecker = new SettingChecker();
      settingChecker.boardCode = 'TEST';
      settingChecker.backlog = true;
      settingChecker.swimlane = 'project';
      settingChecker.filterChecker.project = ['P1'];
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
});

class SettingChecker {
  boardCode: string = null;
  backlog = false;
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
    expect(this.boardCode).toEqual(state.boardCode);
    expect(this.backlog).toEqual(state.backlog);
    if (!this.swimlane) {
      expect(state.swimlane).toBeFalsy();
    } else {
      expect(state.swimlane).toEqual(this.swimlane);
    }
    this.filterChecker.check(state.filters);
  }
}
