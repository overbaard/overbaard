import {Action} from '@ngrx/store';
import {Dictionary} from '../../../common/dictionary';
import {Map, Set} from 'immutable';
import {initialUserSettingState, UserSettingState, UserSettingUtil} from './user-setting.model';
import {boardFilterMetaReducer} from './board-filter/board-filter.reducer';

const CLEAR_SETTINGS = 'CLEAR_SETTINGS';
export const INITIALISE_SETTINGS_FROM_QUERYSTRING = 'INITIALISE_SETTINGS_FROM_QUERYSTRING';
const UPDATE_SWIMLANE = 'UPDATE_SWIMLANE';

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
}

export class UserSettingActions {
  static createClearSettings() {
    return new ClearSettingsAction();
  }

  static createInitialiseFromQueryString(queryParams: Dictionary<string>): Action {
    return new InitialiseFromQueryStringAction(queryParams);
  }

  static createUpdateSwimlane(swimlane: string) {
    return new UpdateSwimlaneAction(swimlane);
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
      });
    }
    case UPDATE_SWIMLANE: {
      return UserSettingUtil.toStateRecord(state).withMutations(mutable => {
        mutable.swimlane = (<UpdateSwimlaneAction>action).payload;
      });
    }
  }
  // Delegate other actions like updating the filters
  return UserSettingUtil.toStateRecord(state).withMutations( mutable => {
    mutable.filters = boardFilterMetaReducer(state.filters, action);
  });
}
