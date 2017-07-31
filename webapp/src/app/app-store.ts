import {Assignee} from './common/assignee/assignee.model';
import * as assignee from './common/assignee/assignee.service';
import {ActionReducer, combineReducers} from '@ngrx/store';
import {environment} from '../environments/environment';

export interface AppState {
  assignees: assignee.AssigneeState;
}

const reducers = {
  assignees: assignee.reducer,
};

const reducerInstance: ActionReducer<AppState> = combineReducers(reducers);

export function reducer(state: any, action: any) {
  return reducerInstance(state, action);
}


