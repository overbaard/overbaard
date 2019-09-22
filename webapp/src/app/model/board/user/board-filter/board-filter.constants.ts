import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import {CustomFieldData} from '../../data/custom-field/custom-field.model';

export interface FilterAttributes {
  display: string;
  key: string;
  hasNone: boolean;
  hasCurrentUser: boolean;
  customField: boolean;
  swimlaneOption: boolean;
}

const DEFAULT_ATTRIBUTES: FilterAttributes = {
  display: '',
  key: '',
  hasNone: false,
  hasCurrentUser: false,
  customField: false,
  swimlaneOption: false
};

export const NONE_FILTER_KEY = '$n$o$n$e$';
export const CURRENT_USER_FILTER_KEY = '$cu$u$r$r$e$n$t$';

interface FilterAttributesRecord extends TypedRecord<FilterAttributesRecord>, FilterAttributes {
}

const FACTORY = makeTypedFactory<FilterAttributes, FilterAttributesRecord>(DEFAULT_ATTRIBUTES);

class AttributesBuilder {
  private _hasNone = false;
  private _hasCurrentUser = false;
  private _customField = false;
  private _swimlaneOption = true;

  constructor(private readonly _display: string, private readonly _key: string) {
  }

  hasNone(): AttributesBuilder {
    this._hasNone = true;
    return this;
  }

  hasCurrentUser(): AttributesBuilder {
    this._hasCurrentUser = true;
    return this;
  }

  isCustomField(): AttributesBuilder {
    this._customField = true;
    return this;
  }

  notSwimlaneOption(): AttributesBuilder {
    return this;
  }

  build(): FilterAttributes {
    return FACTORY(
      {
        display: this._display,
        key: this._key,
        hasNone: this._hasNone,
        hasCurrentUser: this._hasCurrentUser,
        customField: this._customField,
        swimlaneOption: this._swimlaneOption
      });
  }
}

export const PROJECT_ATTRIBUTES = new AttributesBuilder('Project', 'project').build();
export const ISSUE_TYPE_ATTRIBUTES = new AttributesBuilder('Issue Type', 'issue-type').build();
export const PRIORITY_ATTRIBUTES = new AttributesBuilder('Priority', 'priority').build();
export const ASSIGNEE_ATTRIBUTES =
  new AttributesBuilder('Assignee', 'assignee')
    .hasNone()
    .hasCurrentUser()
    .build();
export const COMPONENT_ATTRIBUTES =
  new AttributesBuilder('Component', 'component')
    .hasNone()
    .build();
export const LABEL_ATTRIBUTES =
  new AttributesBuilder('Label', 'label')
    .hasNone()
    .build();
export const FIX_VERSION_ATTRIBUTES =
  new AttributesBuilder('Fix Version', 'fix-version')
    .hasNone()
    .build();
export const PARALLEL_TASK_ATTRIBUTES =
  new AttributesBuilder('Parallel Tasks', 'parallel-tasks')
    .hasNone()
    .notSwimlaneOption()
    .build();

export class FilterAttributesUtil {
  static createCustomFieldFilterAttributes(customFieldName: string, customFieldData: CustomFieldData): FilterAttributes {
    const builder: AttributesBuilder = new AttributesBuilder(customFieldName, customFieldName)
      .hasNone()
      .isCustomField();

    if (customFieldData && customFieldData.type === 'user') {
      // Currently not modifying all tests to pass in the CustomFieldMetadata
      builder.hasCurrentUser();
    }

    return builder.build();
  }
}
