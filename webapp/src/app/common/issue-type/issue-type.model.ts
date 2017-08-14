import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import {Assignee, NO_ASSIGNEE} from '../assignee/assignee.model';
import * as Immutable from 'immutable';

export interface IssueTypeRecord extends TypedRecord<IssueTypeRecord>, IssueType {
}

export interface LinkedIssueRecord extends TypedRecord<LinkedIssueRecord>, IssueType {
}

export interface IssueType {
  name: string;
  icon: string;
}

const DEFAULT_PRIORITY: IssueType = {
  name: null,
  icon: null
};


const ISSUE_TYPED_FACTORY = makeTypedFactory<IssueType, IssueTypeRecord>(DEFAULT_PRIORITY);

export class IssueTypeFactory {
  static fromJS(input: any): IssueType {
    return ISSUE_TYPED_FACTORY(input);
  }
};

