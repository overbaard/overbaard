import {ActionReducer, combineReducers} from '@ngrx/store';
import {environment} from '../environments/environment';
import {compose} from '@ngrx/core/compose';
import {storeFreeze} from 'ngrx-store-freeze';
import {BoardState} from './model/board/board';
import {boardReducer} from './model/board/board.reducer';
import {boardFilterReducer} from './model/board/user/board-filter/board-filter.reducer';
import {BoardFilterState} from './model/board/user/board-filter/board-filter.model';

export interface AppState {
  board: BoardState;
  filters: BoardFilterState;
}

const reducers = {
  board: boardReducer,
  filters: boardFilterReducer

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

