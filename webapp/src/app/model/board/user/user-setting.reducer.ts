import {Action} from '@ngrx/store';
import {Dictionary} from '../../../common/dictionary';
import {List} from 'immutable';
import {initialUserSettingState, UserSettingUtil} from './user-setting.model';
import {boardFilterMetaReducer} from './board-filter/board-filter.reducer';
import {BoardHeader} from '../../../view-model/board/board-header';
import {
  INITIALISE_SETTINGS_FROM_QUERYSTRING,
  InitialiseFromQueryStringAction
} from './initialise-from-querystring.action';
import {UserSettingState} from './user-setting';

const CLEAR_SETTINGS = 'CLEAR_SETTINGS';

const INITIALIZE_STATE_VISIBILITIES = 'INITIALIZE_STATE_VISIBILITIES';
const UPDATE_SWIMLANE = 'UPDATE_SWIMLANE';
const TOGGLE_COLUMN_VISIBILITY = 'TOGGLE_COLUMN_VISIBILITY';
const TOGGLE_BACKLOG = 'TOGGLE_BACKLOG';
const TOGGLE_SHOW_EMPTY_SWIMLANES = 'TOGGLE_SHOW_EMPTY_SWIMLANES';

class ClearSettingsAction implements Action {
  readonly type = CLEAR_SETTINGS;
}


class UpdateSwimlaneAction implements Action {
  readonly type = UPDATE_SWIMLANE;
  constructor(readonly payload: string) {
  }
}

class ToggleVisibilityAction implements Action {
  readonly type = TOGGLE_COLUMN_VISIBILITY;
  constructor(readonly payload: ToggleVisibilityPayload) {
  }
}

class ToggleBacklogAction implements Action {
  readonly type = TOGGLE_BACKLOG;
  constructor(readonly payload: BoardHeader) {
  }
}

class InitialiseStateVisibilitiesAction implements Action {
  readonly type = INITIALIZE_STATE_VISIBILITIES;
  constructor(readonly payload: InitialiseStatesPayload) {
  }
}

class ToggleShowEmptySwimlanesAction implements Action {
  readonly type = TOGGLE_SHOW_EMPTY_SWIMLANES;

}

export class UserSettingActions {
  static createClearSettings() {
    return new ClearSettingsAction();
  }

  static createInitialiseFromQueryString(queryParams: Dictionary<string>): Action {
    return new InitialiseFromQueryStringAction(queryParams);
  }

  static createInitialiseStates(numStates: number, backlog: number): Action {
    return new InitialiseStateVisibilitiesAction({numStates: numStates, backlog: backlog});
  }

  static createUpdateSwimlane(swimlane: string): Action {
    return new UpdateSwimlaneAction(swimlane);
  }

  static toggleBacklog(backlogHeader: BoardHeader): Action {
    return new ToggleBacklogAction(backlogHeader);
  }

  static toggleVisibility(newValue: boolean, states: List<number>): Action {
    return new ToggleVisibilityAction({newValue: newValue, states: states});
  }

  static createToggleShowEmptySwimlanes() {
    return new ToggleShowEmptySwimlanesAction();
  }
}

export function userSettingReducer(state: UserSettingState = initialUserSettingState, action: Action): UserSettingState {
  switch (action.type) {
    case INITIALISE_SETTINGS_FROM_QUERYSTRING: {
      return UserSettingUtil.updateUserSettingState(state, mutable => {
        const initAction: InitialiseFromQueryStringAction = <InitialiseFromQueryStringAction>action;
        mutable.boardCode = initAction.payload['board'];
        mutable.showBacklog = initAction.payload['bl'] ? initAction.payload['bl'] === 'true' : false;
        mutable.swimlane = initAction.payload['swimlane'];
        if (mutable.swimlane) {
          mutable.swimlaneShowEmpty = initAction.payload['showEmptySl'] ? initAction.payload['showEmptySl'] === 'true' : false;
        }
        mutable.filters = boardFilterMetaReducer(state.filters, action);
        mutable.defaultColumnVisibility = initAction.getVisibleColumnDefault();
        mutable.columnVisibilities = initAction.parseVisibleColumns();
      });
    }
    case INITIALIZE_STATE_VISIBILITIES: {
      const initAction: InitialiseStateVisibilitiesAction = <InitialiseStateVisibilitiesAction>action;
      return UserSettingUtil.updateUserSettingState(state, settingState => {
        settingState.columnVisibilities = settingState.columnVisibilities.withMutations(visibilities => {
          for (let i = 0 ; i < initAction.payload.numStates ; i++) {
            const index: number = Number(i);
            if (!visibilities.has(index)) {
              visibilities.set(index, settingState.defaultColumnVisibility);
            }
          }
          for (let i = 0 ; i < initAction.payload.backlog ; i++) {
            if (!settingState.showBacklog) {
              visibilities.set(i, settingState.showBacklog);
            } else {
              if (!visibilities.has(i)) {
                visibilities.set(i, settingState.defaultColumnVisibility);
              }
            }
          }
        });
      });

    }
    case UPDATE_SWIMLANE: {
      return UserSettingUtil.updateUserSettingState(state, mutable => {
        const usa: UpdateSwimlaneAction = <UpdateSwimlaneAction>action;
        if (mutable.swimlane !== usa.payload) {
          mutable.swimlane = usa.payload;
          mutable.swimlaneShowEmpty = false;
        }
      });
    }
    case TOGGLE_BACKLOG: {
      const backlogHeader: BoardHeader = (<ToggleBacklogAction>action).payload;
      return UserSettingUtil.updateUserSettingState(state, settingState => {
        const newValue: boolean = !settingState.showBacklog;
        settingState.showBacklog = newValue;
        settingState.columnVisibilities = settingState.columnVisibilities.withMutations(visibilities => {
          backlogHeader.stateIndices.forEach(stateIndex => {
            visibilities.set(stateIndex, newValue);
          });
        });
      });
    }
    case TOGGLE_COLUMN_VISIBILITY: {
      const payload: ToggleVisibilityPayload = (<ToggleVisibilityAction>action).payload;
      return UserSettingUtil.updateUserSettingState(state, settingState => {
        settingState.columnVisibilities = settingState.columnVisibilities.withMutations(visibilities => {
          payload.states.forEach(stateIndex => {
            visibilities.set(stateIndex, payload.newValue);
          });
        });
      });
    }
    case TOGGLE_SHOW_EMPTY_SWIMLANES: {
      if (state.swimlane) {
        return UserSettingUtil.updateUserSettingState(state, settingState => {
          settingState.swimlaneShowEmpty = !settingState.swimlaneShowEmpty;
        });
      }
    }
  }
  // Delegate other actions like updating the filters
  return UserSettingUtil.updateUserSettingState(state, mutable => {
    mutable.filters = boardFilterMetaReducer(state.filters, action);
  });
}

interface ToggleVisibilityPayload {
  newValue: boolean;
  states: List<number>;
}

interface InitialiseStatesPayload {
  numStates: number;
  backlog: number;
}
