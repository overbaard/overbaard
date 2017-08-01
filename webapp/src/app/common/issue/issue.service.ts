import {Injectable} from '@angular/core';
import {AppState} from '../../app-store';
import {Action, Store} from '@ngrx/store';
import {BoardIssue, IssueFactory} from './issue.model';
import * as Immutable from 'immutable';
import {Assignee} from '../assignee/assignee.model';
import {assigneesSelector} from '../assignee/assignee.service';
import {createSelector} from 'reselect';


const DESERIALIZE_INITIAL_ISSUES = 'ADD_ASSIGNEES';

class DeserializeIssuesAction implements Action {
  readonly type = DESERIALIZE_INITIAL_ISSUES;

  constructor(readonly payload: BoardIssue[]) {
  }
}

export interface IssueState {
  issues: Immutable.OrderedMap<string, BoardIssue>;
}

const initialState = {
  issues: Immutable.OrderedMap<string, BoardIssue>()
};

export function reducer(state: IssueState = initialState, action: Action): IssueState {

  switch (action.type) {
    case DESERIALIZE_INITIAL_ISSUES: {
      const payload: BoardIssue[] = (<DeserializeIssuesAction>action).payload;
      let issues = state.issues;
      issues = issues.withMutations(mutable => {
        for (const issue of payload) {
          mutable.set(issue.key, issue);
        }
      });
      return {
        issues: issues
      };
    }
    default:
      return state;
  }
};

const getIssuesState = (state: AppState) => state.issues;
const getIssues = (state: IssueState) => state.issues;
export const issuesSelector = createSelector(getIssuesState, getIssues);


@Injectable()
export class IssueService {

  constructor(private store: Store<AppState>) {
  }

  deserializeIssues(input: any) {
    let assignees: Assignee[];
    this.store.select(assigneesSelector).subscribe(
      assigneeMap => {assignees = assigneeMap.toArray(); }
    );

    const inputArray: any[] = input ? input : [];
    const issues = new Array<BoardIssue>(inputArray.length);
    inputArray.forEach((issue, i) => {
      issues[i] = IssueFactory.fromJS(issue, assignees);
    });


    this.store.dispatch(new DeserializeIssuesAction(issues));
  }

}

