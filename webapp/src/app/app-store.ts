import * as board from './common/board/board.reducer';
import {ActionReducer, combineReducers} from '@ngrx/store';

export interface AppState {
  board: board.BoardState;
}

const reducers = {
  board: board.reducer
};

const reducerInstance: ActionReducer<AppState> = combineReducers(reducers);

export function reducer(state: any, action: any) {
  return reducerInstance(state, action);
}


