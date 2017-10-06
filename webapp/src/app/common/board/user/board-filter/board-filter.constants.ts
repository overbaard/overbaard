import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';

export interface FilterAttributes {
  display: string;
  key: string;
  hasNone: boolean;
}

const DEFAULT_ATTRIBUTES: FilterAttributes = {
  display: '',
  key: '',
  hasNone: false
};

interface FilterAttributesRecord extends TypedRecord<FilterAttributesRecord>, FilterAttributes {
}

const FACTORY = makeTypedFactory<FilterAttributes, FilterAttributesRecord>(DEFAULT_ATTRIBUTES);

export const PROJECT = FACTORY({display: 'Project', key: 'project', hasNone: false});
export const ISSUE_TYPE = FACTORY({display: 'Issue Type', key: 'issue-type', hasNone: false});
export const PRIORITY = FACTORY({display: 'Priority', key: 'priority', hasNone: false});
export const ASSIGNEE = FACTORY({display: 'Assignee', key: 'assignee', hasNone: true});
export const COMPONENT = FACTORY({display: 'Component', key: 'component', hasNone: true});
export const LABEL = FACTORY({display: 'Label', key: 'label', hasNone: true});
export const FIX_VERSION = FACTORY({display: 'Fix Version', key: 'fix-version', hasNone: true});

