import {Action} from '@ngrx/store';
import {Dictionary} from '../../../common/dictionary';
import {List, Map, Set} from 'immutable';
import {initialUserSettingState, UserSettingState, UserSettingUtil} from './user-setting.model';
import {boardFilterMetaReducer} from './board-filter/board-filter.reducer';

const CLEAR_SETTINGS = 'CLEAR_SETTINGS';
export const INITIALISE_SETTINGS_FROM_QUERYSTRING = 'INITIALISE_SETTINGS_FROM_QUERYSTRING';
const UPDATE_SWIMLANE = 'UPDATE_SWIMLANE';
const TOGGLE_COLUMN_VISIBILITY = 'TOGGLE_COLUMN_VISIBILITY';

export class ClearSettingsAction implements Action {
  readonly type = CLEAR_SETTINGS;
}

export class UpdateSwimlaneAction implements Action {
  readonly type = UPDATE_SWIMLANE;
  constructor(readonly payload: string) {
  }
}

export class InitialiseFromQueryStringAction implements Action {
  readonly type = INITIALISE_SETTINGS_FROM_QUERYSTRING;

  constructor(readonly payload: Dictionary<string>) {
  }

  parseCustomFieldFilters(): Map<string, Set<string>> {
    return this.parsePrefixedMapFilters('cf.');
  }

  parseParallelTaskFilters(): Map<string, Set<string>> {
    return this.parsePrefixedMapFilters('pt.');
  }

  private parsePrefixedMapFilters(prefix: string): Map<string, Set<string>> {
    return Map<string, Set<string>>().withMutations(mutable => {
      for (const key of Object.keys(this.payload)) {
        if (key.startsWith(prefix)) {
          const name: string = decodeURIComponent(key.substr(prefix.length));
          mutable.set(name, this.parseBooleanFilter(key));
        }
      }
    });
  }

  parseBooleanFilter(name: string): Set<string> {
    const valueString: string = this.payload[name];
    const set: Set<string> = Set<string>();
    if (valueString) {
      return set.withMutations(mutable => {
        const values: string[] = valueString.split(',');
        for (const value of values) {
          const decoded = decodeURIComponent(value);
          mutable.add(decoded);
        }
      });
    }
    return set;
  }

  getVisibleColumnDefault(): boolean {
    if (this.payload['visible']) {
      return false;
    } else if (this.payload['hidden']) {
      return true;
    } else {
      return true;
    }
  }

  parseVisibleColumns(): Map<number, boolean> {
    let visible: boolean;
    let valueString: string;
    if (this.payload['visible']) {
      valueString = this.payload['visible'];
      visible = true;
    } else if (this.payload['hidden']) {
      valueString = this.payload['hidden'];
      visible = false;
    }
    return Map<number, boolean>().withMutations(mutable => {
      if (valueString) {
        const values: string[] = valueString.split(',');
        for (const value of values) {
          mutable.set(Number(value), visible);
        }
      }
    });
  }
}

export class ToggleVisibilityAction implements Action {
  readonly type = TOGGLE_COLUMN_VISIBILITY;
  constructor(readonly payload: List<number>) {
  }
}

export class UserSettingActions {
  static createClearSettings() {
    return new ClearSettingsAction();
  }

  static createInitialiseFromQueryString(queryParams: Dictionary<string>): Action {
    return new InitialiseFromQueryStringAction(queryParams);
  }

  static createUpdateSwimlane(swimlane: string): Action {
    return new UpdateSwimlaneAction(swimlane);
  }

  static toggleVisibility(states: List<number>): Action {
    return new ToggleVisibilityAction(states);
  }
}

export function userSettingReducer(state: UserSettingState = initialUserSettingState, action: Action): UserSettingState {
  switch (action.type) {
    case INITIALISE_SETTINGS_FROM_QUERYSTRING: {
      return UserSettingUtil.toStateRecord(state).withMutations( mutable => {
        const initAction: InitialiseFromQueryStringAction = <InitialiseFromQueryStringAction>action;
        mutable.boardCode = initAction.payload['board'];
        mutable.backlog = initAction.payload['bl'] ? initAction.payload['bl'] === 'true' : false;
        mutable.swimlane = initAction.payload['swimlane'];
        mutable.filters = boardFilterMetaReducer(state.filters, action);
        mutable.defaultColumnVisibility = initAction.getVisibleColumnDefault();
        mutable.columnVisibilities = initAction.parseVisibleColumns();
      });
    }
    case UPDATE_SWIMLANE: {
      return UserSettingUtil.toStateRecord(state).withMutations(mutable => {
        mutable.swimlane = (<UpdateSwimlaneAction>action).payload;
      });
    }
    case TOGGLE_COLUMN_VISIBILITY: {
      const toggleAction: ToggleVisibilityAction = <ToggleVisibilityAction>action;
      const states: List<number> = toggleAction.payload;
      return UserSettingUtil.toStateRecord(state).withMutations(settingsState => {
        settingsState.columnVisibilities = settingsState.columnVisibilities.withMutations(visibilities => {
          if (states.size === 1) {
            // With just one state is is a state header
            const s = states.get(0);
            const currentVisibility = !visibilities.has(s) ? settingsState.defaultColumnVisibility : visibilities.get(s);
            visibilities.set(s, !currentVisibility);
          } else {
            // If it has several states it is a category header. If all are false, make them all true. Otherwise make them all false.
            let allFalse = true;
            states.forEach(s => {
              const currentVisibility: boolean = !visibilities.has(s) ? settingsState.defaultColumnVisibility : visibilities.get(s);
              if (currentVisibility) {
                allFalse = false;
                return false;
              }
            });
            states.forEach(s => {
              visibilities.set(s, allFalse);
            });
          }
        });
      });
    }
  }
  // Delegate other actions like updating the filters
  return UserSettingUtil.toStateRecord(state).withMutations( mutable => {
    mutable.filters = boardFilterMetaReducer(state.filters, action);
  });
}


