import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import {List, OrderedMap} from 'immutable';


export interface CustomFieldState {
  fields: OrderedMap<string, List<CustomField>>;
}

export interface CustomField {
  key: string;
  value: string;
}

const DEFAULT_STATE: CustomFieldState = {
  fields: OrderedMap<string, List<CustomField>>()
};

const DEFAULT_COMPONENT: CustomField = {
  key: null,
  value: null
};

interface CustomFieldStateRecord extends TypedRecord<CustomFieldStateRecord>, CustomFieldState {
}

interface CustomFieldRecord extends TypedRecord<CustomFieldRecord>, CustomField {
}

const STATE_FACTORY = makeTypedFactory<CustomFieldState, CustomFieldStateRecord>(DEFAULT_STATE);
const CUSTOM_FIELD_FACTORY = makeTypedFactory<CustomField, CustomFieldRecord>(DEFAULT_COMPONENT);
export const initialCustomFieldState: CustomFieldState = STATE_FACTORY(DEFAULT_STATE);

export class CustomFieldUtil {
  static fromJs(input: any): CustomField {
      return CUSTOM_FIELD_FACTORY(input);
  }

  static toStateRecord(s: CustomFieldState): CustomFieldStateRecord {
    // TODO do some checks. TS does not allow use of instanceof when the type is an interface (since they are compiled away)
    return <CustomFieldStateRecord>s;
  }
}

