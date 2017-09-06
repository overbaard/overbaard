import {Action} from '@ngrx/store';
import {List, OrderedMap} from 'immutable';
import {CustomField, CustomFieldState, CustomFieldUtil, initialCustomFieldState} from './custom-field.model';


const DESERIALIZE_ALL_CUSTOM_FIELDS = 'DESERIALIZE_ALL_CUSTOM_FIELDS';

class DeserializeCustomFieldsAction implements Action {
  readonly type = DESERIALIZE_ALL_CUSTOM_FIELDS;

  constructor(readonly payload: OrderedMap<string, List<CustomField>>) {
  }
}

export class CustomFieldActions {
  static createDeserializeCustomFields(input: any): Action {
    const keys: string[] = Object.keys(input).sort((a, b) => a.toLocaleLowerCase().localeCompare(b.toLocaleLowerCase()));
    const map: OrderedMap<string, List<CustomField>> = OrderedMap<string, List<CustomField>>().withMutations(mutable => {
      for (const key of keys) {
        const inputArray: any[] = input[key];
        const cfs: CustomField[] = new Array<CustomField>(inputArray.length);
        for (let i = 0 ; i < inputArray.length ; i++) {
          cfs[i] = CustomFieldUtil.fromJs(inputArray[i]);
        }
        mutable.set(key, List<CustomField>(cfs));
      }
    });

    return new DeserializeCustomFieldsAction(map);
  }
}

export function customFieldReducer(state: CustomFieldState = initialCustomFieldState, action: Action): CustomFieldState {

  switch (action.type) {
    case DESERIALIZE_ALL_CUSTOM_FIELDS: {
      const payload: OrderedMap<string, List<CustomField>> = (<DeserializeCustomFieldsAction>action).payload;
      const newState = CustomFieldUtil.toStateRecord(state).withMutations(mutable => {
        mutable.fields = payload;
      });
      if ((CustomFieldUtil.toStateRecord(newState)).equals(CustomFieldUtil.toStateRecord(state))) {
        return state;
      }
      return newState;
    }
    default:
      return state;
  }
};
