import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';

export interface PriorityRecord extends TypedRecord<PriorityRecord>, Priority {
}

export interface LinkedIssueRecord extends TypedRecord<LinkedIssueRecord>, Priority {
}

export interface Priority {
  name: string;
  icon: string;
}

const DEFAULT_PRIORITY: Priority = {
  name: null,
  icon: null
};


/*
 make the factory to enable the generation of animal records
 */
const ISSUE_TYPED_FACTORY = makeTypedFactory<Priority, PriorityRecord>(DEFAULT_PRIORITY);

export class PriorityFactory {
  static fromJS(input: any): Priority {
    return ISSUE_TYPED_FACTORY(input);
  }
};

