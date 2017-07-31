import {Injectable} from '@angular/core';
import {AppState} from '../../app-store';
import {Action, Store} from '@ngrx/store';
import {BoardIssue} from './issue.model';
import * as Immutable from 'immutable';


const DESERIALIZE_ISSUES = 'ADD_ASSIGNEES';
const CLEAR_ISSUES = 'CLEAR_ASSIGNEES';

class DeserializeIssuesAction implements Action {
  readonly type = DESERIALIZE_ISSUES;

  constructor(readonly payload: BoardIssue[]) {
  }
}

class ClearIssuesAction implements Action {
  readonly type = CLEAR_ISSUES;
}

export interface IssuesState {
  issues: Immutable.OrderedMap<string, BoardIssue>;
}

const initialState = {
  issues: Immutable.OrderedMap<string, BoardIssue>()
};

@Injectable()
export class IssueService {

  constructor(private store: Store<AppState>) {
  }

}
