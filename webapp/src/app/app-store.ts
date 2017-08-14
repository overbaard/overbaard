import  {Assignee} from './common/assignee/assignee.model';
import * as assignee from './common/assignee/assignee.service';
import * as issue from './common/issue/issue.service';
import * as issueType from './common/issue-type/issue-type.service';
import * as priority from './common/priority/priority.service';
import {ActionReducer, combineReducers} from '@ngrx/store';

export interface AppState {
  assignees: assignee.AssigneeState;
  issues: issue.IssueState;
  issueTypes: issueType.IssueTypeState;
  priorities: priority.PriorityState;
}

const reducers = {
  assignees: assignee.reducer,
  issues: issue.reducer,
  issueTypes: issueType.reducer,
  priorities: priority.reducer
};

const reducerInstance: ActionReducer<AppState> = combineReducers(reducers);

export function reducer(state: any, action: any) {
  return reducerInstance(state, action);
}


