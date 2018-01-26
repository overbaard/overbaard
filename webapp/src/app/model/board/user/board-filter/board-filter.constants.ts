import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';

export interface FilterAttributes {
  display: string;
  key: string;
  hasNone: boolean;
  customField: boolean;
  swimlaneOption: boolean;
}

const DEFAULT_ATTRIBUTES: FilterAttributes = {
  display: '',
  key: '',
  hasNone: false,
  customField: false,
  swimlaneOption: false
};

export const NONE_FILTER_KEY = '$n$o$n$e$';
export const CURRENT_USER_FILTER_KEY = '$cu$u$r$r$e$n$t$';

interface FilterAttributesRecord extends TypedRecord<FilterAttributesRecord>, FilterAttributes {
}

const FACTORY = makeTypedFactory<FilterAttributes, FilterAttributesRecord>(DEFAULT_ATTRIBUTES);

export const PROJECT_ATTRIBUTES = FACTORY(FilterAttributes('Project', 'project', false, false, true));
export const ISSUE_TYPE_ATTRIBUTES = FACTORY(FilterAttributes('Issue Type', 'issue-type', false, false, true));
export const PRIORITY_ATTRIBUTES = FACTORY(FilterAttributes('Priority', 'priority', false, false, true));
export const ASSIGNEE_ATTRIBUTES = FACTORY(FilterAttributes('Assignee', 'assignee', true, false, true));
export const COMPONENT_ATTRIBUTES = FACTORY(FilterAttributes('Component', 'component', true, false, true));
export const LABEL_ATTRIBUTES = FACTORY(FilterAttributes('Label', 'label', true, false, true));
export const FIX_VERSION_ATTRIBUTES = FACTORY(FilterAttributes('Fix Version', 'fix-version', true, false, true));
export const PARALLEL_TASK_ATTRIBUTES = FACTORY(FilterAttributes('Parallel Tasks', 'parallel-tasks', true, false, false));

function FilterAttributes(display: string, key: string, hasNone: boolean, customField: boolean, swimlaneOption: boolean): FilterAttributes {
  return {
    display: display,
    key: key,
    hasNone: hasNone,
    customField: customField,
    swimlaneOption: swimlaneOption
  };
}

export class FilterAttributesUtil {
  static createCustomFieldFilterAttributes(customFieldName: string): FilterAttributes {
    return FACTORY(FilterAttributes(customFieldName, customFieldName, true, true, true));
  }
}
