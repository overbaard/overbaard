import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';

export interface FilterAttributes {
  display: string;
  key: string;
  hasNone: boolean;
  customField: boolean;
}

const DEFAULT_ATTRIBUTES: FilterAttributes = {
  display: '',
  key: '',
  hasNone: false,
  customField: false
};

export const NONE_FILTER = '$n$o$n$e$';

interface FilterAttributesRecord extends TypedRecord<FilterAttributesRecord>, FilterAttributes {
}

const FACTORY = makeTypedFactory<FilterAttributes, FilterAttributesRecord>(DEFAULT_ATTRIBUTES);

export const PROJECT_ATTRIBUTES = FACTORY({display: 'Project', key: 'project', hasNone: false, customField: false});
export const ISSUE_TYPE_ATTRIBUTES = FACTORY({display: 'Issue Type', key: 'issue-type', hasNone: false, customField: false});
export const PRIORITY_ATTRIBUTES = FACTORY({display: 'Priority', key: 'priority', hasNone: false, customField: false});
export const ASSIGNEE_ATTRIBUTES = FACTORY({display: 'Assignee', key: 'assignee', hasNone: true, customField: false});
export const COMPONENT_ATTRIBUTES = FACTORY({display: 'Component', key: 'component', hasNone: true, customField: false});
export const LABEL_ATTRIBUTES = FACTORY({display: 'Label', key: 'label', hasNone: true, customField: false});
export const FIX_VERSION_ATTRIBUTES = FACTORY({display: 'Fix Version', key: 'fix-version', hasNone: true, customField: false});
export const PARALLEL_TASK_ATTRIBUTES = FACTORY({display: 'Parallel Tasks', key: 'parallel-tasks', hasNone: true, customField: false});

export class FilterAttributesUtil {
  static createCustomFieldFilterAttributes(customFieldName: string): FilterAttributes {
    return FACTORY({display: customFieldName, key: customFieldName, hasNone: true, customField: true});
  }
}
