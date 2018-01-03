import {makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import {OrderedMap} from 'immutable';
import {FixVersionState} from '../fix-version/fix-version.model';


export interface CustomFieldState {
  fields: OrderedMap<string, OrderedMap<string, CustomField>>;
}

export interface CustomField {
  key: string;
  value: string;
}

const DEFAULT_STATE: CustomFieldState = {
  fields: OrderedMap<string, OrderedMap<string, CustomField>>()
};

const DEFAULT_CUSTOM_FIELD: CustomField = {
  key: null,
  value: null
};

interface CustomFieldStateRecord extends TypedRecord<CustomFieldStateRecord>, CustomFieldState {
}

interface CustomFieldRecord extends TypedRecord<CustomFieldRecord>, CustomField {
}

const STATE_FACTORY = makeTypedFactory<CustomFieldState, CustomFieldStateRecord>(DEFAULT_STATE);
const CUSTOM_FIELD_FACTORY = makeTypedFactory<CustomField, CustomFieldRecord>(DEFAULT_CUSTOM_FIELD);
export const initialCustomFieldState: CustomFieldState = STATE_FACTORY(DEFAULT_STATE);

export class CustomFieldUtil {
  static fromJs(input: any): CustomField {
      return CUSTOM_FIELD_FACTORY(input);
  }

  static withMutations(s: CustomFieldState, mutate: (mutable: CustomFieldState) => any): CustomFieldState {
    return (<CustomFieldStateRecord>s).withMutations(mutable => {
      mutate(mutable);
    });
  }
}

