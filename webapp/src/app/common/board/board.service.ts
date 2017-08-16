import * as assignee from '../assignee/assignee.service';
import * as issue from '../issue/issue.service';
import * as issueType from '../issue-type/issue-type.service';
import * as priority from '../priority/priority.service';
import {ActionReducer, combineReducers} from '@ngrx/store';
import {AppState} from '../../app-store';

export interface BoardState {
  viewId: number;
  assignees: assignee.AssigneeState;
  issues: issue.IssueState;
  issueTypes: issueType.IssueTypeState;
  priorities: priority.PriorityState;
}

const initialState: BoardState = {
  viewId: 0,
  assignees: assignee.initialState,
  issues: issue.initialState,
  issueTypes: issueType.initialState,
  priorities: priority.initialState
}

const reducers = {
  assignees: assignee.reducer,
  issues: issue.reducer,
  issueTypes: issueType.reducer,
  priorities: priority.reducer
};

const reducerInstance: ActionReducer<BoardState> = combineReducers(reducers);

export function reducer(state: any, action: any) {
  return reducerInstance(state, action);
}

const getBoardState = (state: AppState) => state.board;


