import {ActionReducerMap, MetaReducer} from '@ngrx/store';
import {environment} from '../environments/environment';
import {BoardState} from './model/board/data/board';
import {boardReducer} from './model/board/data/board.reducer';
import {userSettingReducer} from './model/board/user/user-setting.reducer';
import {UserSettingState} from './model/board/user/user-setting';
import {storeFreeze} from 'ngrx-store-freeze';
import {initialBoardState} from './model/board/data/board.model';
import {initialUserSettingState} from './model/board/user/user-setting.model';

export interface AppState {
  board: BoardState;
  userSettings: UserSettingState;
}

export const reducers: ActionReducerMap<AppState> = {
  board: boardReducer,
  userSettings: userSettingReducer,
};

export const initialAppState: AppState = {
  board: initialBoardState,
  userSettings: initialUserSettingState
}

/**
 * By default, @ngrx/store uses combineReducers with the reducer map to compose
 * the root meta-reducer. To add more meta-reducers, provide an array of meta-reducers
 * that will be composed to form the root meta-reducer.
 */
export const metaReducers: MetaReducer<AppState>[] = !environment.production
  ? [storeFreeze]
  : [];

