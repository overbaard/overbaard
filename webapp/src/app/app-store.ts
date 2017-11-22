import {ActionReducer, combineReducers} from '@ngrx/store';
import {environment} from '../environments/environment';
import {compose} from '@ngrx/store';
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
const productionReducer: ActionReducer<AppState> = combineReducers(reducers);
// storeFreeze is not in ngrx/store 4 yet
const developmentReducer: ActionReducer<AppState> = productionReducer; // compose(storeFreeze, combineReducers)(reducers);

export function reducer(state: any, action: any) {
  if (environment.production) {
    return productionReducer(state, action);
  } else {
    return developmentReducer(state, action);
  }
}

