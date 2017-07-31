import {Injectable} from '@angular/core';
import {AppState} from '../../app-store';
import {Action, Store} from '@ngrx/store';
import {BoardIssue, IssueFactory} from './issue.model';
import * as Immutable from 'immutable';
import {Assignee} from '../assignee/assignee.model';
import {assigneesSelector} from '../assignee/assignee.service';


const DESERIALIZE_ISSUES = 'ADD_ASSIGNEES';

class DeserializeIssuesAction implements Action {
  readonly type = DESERIALIZE_ISSUES;

  constructor(readonly payload: BoardIssue[]) {
  }
}

export interface IssuesState {
  issues: Immutable.OrderedMap<string, BoardIssue>;
}

const initialState = {
  issues: Immutable.OrderedMap<string, BoardIssue>()
};

export function reducer(state: IssuesState = initialState, action: Action): IssuesState {

  switch (action.type) {
    case DESERIALIZE_ISSUES: {
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

