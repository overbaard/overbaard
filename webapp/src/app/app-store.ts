import * as board from './common/board/board.reducer';
import {ActionReducer, combineReducers} from '@ngrx/store';
import {environment} from '../environments/environment';
import {compose} from '@ngrx/core/compose';
import {storeFreeze} from 'ngrx-store-freeze';
import {BoardState} from './common/board/board';

export interface AppState {
  board: BoardState;
}

const reducers = {
  board: board.boardReducer
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

