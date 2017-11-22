import {ActionReducerMap, MetaReducer} from '@ngrx/store';
import {environment} from '../environments/environment';
import {BoardState} from './model/board/data/board';
import {boardReducer} from './model/board/data/board.reducer';
import {userSettingReducer} from './model/board/user/user-setting.reducer';
import {UserSettingState} from './model/board/user/user-setting';
import {storeFreeze} from 'ngrx-store-freeze';

export interface AppState {
  board: BoardState;
  userSettings: UserSettingState;
}

export const reducers: ActionReducerMap<AppState> = {
  board: boardReducer,
  userSettings: userSettingReducer,
};

/**
 * By default, @ngrx/store uses combineReducers with the reducer map to compose
 * the root meta-reducer. To add more meta-reducers, provide an array of meta-reducers
 * that will be composed to form the root meta-reducer.
 */
export const metaReducers: MetaReducer<AppState>[] = !environment.production
  ? [storeFreeze]
  : [];

