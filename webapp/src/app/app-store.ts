import {ActionReducerMap, MetaReducer} from '@ngrx/store';
import {environment} from '../environments/environment';
import {BoardState} from './model/board/data/board';
import {boardReducer} from './model/board/data/board.reducer';
import {userSettingReducer} from './model/board/user/user-setting.reducer';
import {UserSettingState} from './model/board/user/user-setting';
import {storeFreeze} from 'ngrx-store-freeze';
import {initialBoardState} from './model/board/data/board.model';
import {initialUserSettingState} from './model/board/user/user-setting.model';
import {ProgressLogState} from './model/global/progress-log/progress-log';
import {progressLogReducer} from './model/global/progress-log/progress-log.reducer';
import {initialProgressLogState} from './model/global/progress-log/progress-log.model';

export interface AppState {
  progressLog: ProgressLogState;
  board: BoardState;
  userSettings: UserSettingState;
}

export const reducers: ActionReducerMap<AppState> = {
  progressLog: progressLogReducer,
  board: boardReducer,
  userSettings: userSettingReducer,
};

export const initialAppState: AppState = {
  progressLog: initialProgressLogState,
  board: initialBoardState,
  userSettings: initialUserSettingState
};

/**
 * By default, @ngrx/store uses combineReducers with the reducer map to compose
 * the root meta-reducer. To add more meta-reducers, provide an array of meta-reducers
 * that will be composed to form the root meta-reducer.
 */
export const metaReducers: MetaReducer<AppState>[] = !environment.production
  ? [storeFreeze]
  : [];

