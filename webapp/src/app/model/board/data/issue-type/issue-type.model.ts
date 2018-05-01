import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import {OrderedMap} from 'immutable';

export interface IssueTypeState {
  types: OrderedMap<string, IssueType>;
}

export interface IssueType {
  name: string;
  colour: string;
}

const DEFAULT_STATE: IssueTypeState = {
  types: OrderedMap<string, IssueType>()
};

const DEFAULT_ISSUE: IssueType = {
  name: null,
  colour: null
};

interface IssueTypeRecord extends TypedRecord<IssueTypeRecord>, IssueType {
}

interface LinkedIssueRecord extends TypedRecord<LinkedIssueRecord>, IssueType {
}

interface IssueTypeStateRecord extends TypedRecord<IssueTypeStateRecord>, IssueTypeState {
}

const STATE_FACTORY = makeTypedFactory<IssueTypeState, IssueTypeStateRecord>(DEFAULT_STATE);
const ISSUE_FACTORY = makeTypedFactory<IssueType, IssueTypeRecord>(DEFAULT_ISSUE);
export const initialIssueTypeState: IssueTypeState = STATE_FACTORY(DEFAULT_STATE);

export class IssueTypeUtil {
  static fromJS(input: any): IssueType {
    return ISSUE_FACTORY(input);
  }

  static withMutations(s: IssueTypeState, mutate: (mutable: IssueTypeState) => any): IssueTypeState {
    return (<IssueTypeStateRecord>s).withMutations(mutable => {
      mutate(mutable);
    });
  }
}


