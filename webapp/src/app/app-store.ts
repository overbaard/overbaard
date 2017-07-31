import  {Assignee} from './common/assignee/assignee.model';
import * as assignee from './common/assignee/assignee.service';
import * as issue from './common/issue/issue.service';
import {ActionReducer, combineReducers} from '@ngrx/store';
import {environment} from '../environments/environment';

export interface AppState {
  assignees: assignee.AssigneeState;
  issues: issue.IssuesState;
}

const reducers = {
  assignees: assignee.reducer,
  issues: issue.reducer
};

const reducerInstance: ActionReducer<AppState> = combineReducers(reducers);

export function reducer(state: any, action: any) {
  return reducerInstance(state, action);
}


