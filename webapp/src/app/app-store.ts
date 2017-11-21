import {ActionReducer, combineReducers} from '@ngrx/store';
import {environment} from '../environments/environment';
import {compose} from '@ngrx/core/compose';
import {storeFreeze} from 'ngrx-store-freeze';
import {BoardState} from './model/board/data/board';
import {boardReducer} from './model/board/data/board.reducer';
import {userSettingReducer} from './model/board/user/user-setting.reducer';
import {UserSettingState} from './model/board/user/user-setting';

export interface AppState {
  board: BoardState;
  userSettings: UserSettingState;
}

const reducers = {
  board: boardReducer,
  userSettings: userSettingReducer

};

const developmentReducer: ActionReducer<AppState> = compose(storeFreeze, combineReducers)(reducers);
const productionReducer: ActionReducer<AppState> = combineReducers(reducers);

export function reducer(state: any, action: any) {
  if (environment.production) {
    return productionReducer(state, action);
  } else {
    return developmentReducer(state, action);
  }
}

