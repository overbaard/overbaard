import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import {Assignee, NO_ASSIGNEE} from '../assignee/assignee.model';
import * as Immutable from 'immutable';

export interface BoardIssueRecord extends TypedRecord<BoardIssueRecord>, BoardIssue {
}

export interface LinkedIssueRecord extends TypedRecord<LinkedIssueRecord>, Issue {
}

export interface Issue {
  key: string;
  summary: string;
}

export interface BoardIssue extends Issue {
  assignee: Assignee;
  linkedIssues: Immutable.List<Issue>;
}

const DEFAULT_ISSUE: BoardIssue = {
  key: null,
  summary: null,
  assignee: null,
  linkedIssues: Immutable.List<Issue>()
};

const DEFAULT_LINKED_ISSUE: Issue = {
  key: null,
  summary: null
};

const ISSUE_TYPED_FACTORY = makeTypedFactory<BoardIssue, BoardIssueRecord>(DEFAULT_ISSUE);
const LINKED_ISSUE_TYPED_FACTORY = makeTypedFactory<Issue, LinkedIssueRecord>(DEFAULT_LINKED_ISSUE);

export class IssueFactory {

  static fromJS(input: any, assignees: Assignee[]): BoardIssue {
    // Rework the data as needed before deserializing
    if (input['linked-issues']) {
      input['linkedIssues'] = input['linked-issues'];
    }
    delete input['linked-issues'];

    if (input['assignee'] || input['assignee'] === 0) {
      input['assignee'] = assignees[input['assignee']];
    } else {
      input['assignee'] = NO_ASSIGNEE;
    }

    const temp: any = Immutable.fromJS(input, (key, value) => {
      if (key === 'linkedIssues') {
        const tmp: Immutable.List<any> = value.toList();
        return tmp.withMutations(mutable => {
          tmp.forEach((li, i) => {
            mutable.set(i, LINKED_ISSUE_TYPED_FACTORY(<any>li));
          });
        });
      }
      return value;
    });
    return ISSUE_TYPED_FACTORY(temp);
  }
};

