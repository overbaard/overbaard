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

export const PROJECT_ATTRIBUTES = FACTORY({display: 'Project', key: 'project', hasNone: false});
export const ISSUE_TYPE_ATTRIBUTES = FACTORY({display: 'Issue Type', key: 'issue-type', hasNone: false});
export const PRIORITY_ATTRIBUTES = FACTORY({display: 'Priority', key: 'priority', hasNone: false});
export const ASSIGNEE_ATTRIBUTES = FACTORY({display: 'Assignee', key: 'assignee', hasNone: true});
export const COMPONENT_ATTRIBUTES = FACTORY({display: 'Component', key: 'component', hasNone: true});
export const LABEL_ATTRIBUTES = FACTORY({display: 'Label', key: 'label', hasNone: true});
export const FIX_VERSION_ATTRIBUTES = FACTORY({display: 'Fix Version', key: 'fix-version', hasNone: true});

