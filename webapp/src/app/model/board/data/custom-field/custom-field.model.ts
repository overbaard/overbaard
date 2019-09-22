import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import {OrderedMap} from 'immutable';

/**
 * Custom field state
 */
export interface CustomFieldState {
  /** All custom fields ordered by name */
  fields: OrderedMap<string, CustomFieldData>;
}

/**
 * Entries for one custom field
 */
export interface CustomFieldData {
  type: string;
  /** All values for the custom field */
  fieldValues: OrderedMap<string, CustomFieldValue>;
}

/**
 * A custom field value
 */
export interface CustomFieldValue {
  key: string;
  value: string;
}

const DEFAULT_STATE: CustomFieldState = {
  fields: OrderedMap<string, CustomFieldData>()
};

const DEFAULT_CUSTOM_FIELD_DATA: CustomFieldData = {
  type: null,
  fieldValues: OrderedMap<string, CustomFieldValue>()
};

const DEFAULT_CUSTOM_FIELD_VALUE: CustomFieldValue = {
  key: null,
  value: null
};

interface CustomFieldStateRecord extends TypedRecord<CustomFieldStateRecord>, CustomFieldState {
}

interface CustomFieldDataRecord extends TypedRecord<CustomFieldDataRecord>, CustomFieldData {
}

interface CustomFieldValueRecord extends TypedRecord<CustomFieldValueRecord>, CustomFieldValue {
}

const STATE_FACTORY = makeTypedFactory<CustomFieldState, CustomFieldStateRecord>(DEFAULT_STATE);
const CUSTOM_FIELD_DATA_FACTORY = makeTypedFactory<CustomFieldData, CustomFieldDataRecord>(DEFAULT_CUSTOM_FIELD_DATA);
const CUSTOM_FIELD_FACTORY = makeTypedFactory<CustomFieldValue, CustomFieldValueRecord>(DEFAULT_CUSTOM_FIELD_VALUE);
export const initialCustomFieldState: CustomFieldState = STATE_FACTORY(DEFAULT_STATE);


export class CustomFieldUtil {
  static fieldFromJs(input: any): CustomFieldValue {
      return CUSTOM_FIELD_FACTORY(input);
  }

  static withMutations(s: CustomFieldState, mutate: (mutable: CustomFieldState) => any): CustomFieldState {
    return (<CustomFieldStateRecord>s).withMutations(mutable => {
      mutate(mutable);
    });
  }

  static createCustomFieldData(type: string, values: OrderedMap<string, CustomFieldValue>): CustomFieldData {
    return CUSTOM_FIELD_DATA_FACTORY({type: type, fieldValues: values});
  }

  static updateCustomFieldValues(data: CustomFieldData, values: OrderedMap<string, CustomFieldValue>): CustomFieldData {
    return this.createCustomFieldData(data.type, values);
  }
}

