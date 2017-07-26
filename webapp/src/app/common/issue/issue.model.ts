import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import {Assignee} from '../assignee/assignee.model';
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

/*
 make the factory to enable the generation of animal records
 */
const ISSUE_TYPED_FACTORY = makeTypedFactory<BoardIssue, BoardIssueRecord>(DEFAULT_ISSUE);
const LINKED_ISSUE_TYPED_FACTORY = makeTypedFactory<Issue, LinkedIssueRecord>(DEFAULT_LINKED_ISSUE);

export class IssueFactory {

  static fromJS(input: any): BoardIssue {
    // TODO Try to make this work with a reviver function (I was unsuccessful so far in making it do this eagerly)
    IssueFactory.convertLinkedIssues(input);

    const temp: any = Immutable.fromJS(input);
    return ISSUE_TYPED_FACTORY(temp);
  }

  static convertLinkedIssues(input: any) {
    const linkedIssues: any[] = input['linked-issues'];
    delete input['linked-issues'];
    if (linkedIssues) {
      linkedIssues.forEach((li, i, arr) => {
        arr[i] = LINKED_ISSUE_TYPED_FACTORY(<any>li);
      });
    }
    input['linkedIssues'] = linkedIssues;
  }

};

