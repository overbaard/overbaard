import {Action} from '@ngrx/store';
import {List, Map, OrderedMap} from 'immutable';
import {CustomField, CustomFieldState, CustomFieldUtil, initialCustomFieldState} from './custom-field.model';


const DESERIALIZE_ALL_CUSTOM_FIELDS = 'DESERIALIZE_ALL_CUSTOM_FIELDS';
const ADD_CUSTOM_FIELDS = 'ADD_CUSTOM_FIELDS';

class DeserializeCustomFieldsAction implements Action {
  readonly type = DESERIALIZE_ALL_CUSTOM_FIELDS;

  constructor(readonly payload: OrderedMap<string, List<CustomField>>) {
  }
}

class AddCustomFieldsAction implements Action {
  readonly type = ADD_CUSTOM_FIELDS;

  constructor(readonly payload: Map<string, List<CustomField>>) {
  }
}

export class CustomFieldActions {
  static createDeserializeCustomFields(input: any): Action {
    const keys: string[] = Object.keys(input).sort((a, b) => a.toLocaleLowerCase().localeCompare(b.toLocaleLowerCase()));
    const map: OrderedMap<string, List<CustomField>> = OrderedMap<string, List<CustomField>>().withMutations(mutable => {
      for (const key of keys) {
        mutable.set(key, this.createListFromInput(input, key));
      }
    });

    return new DeserializeCustomFieldsAction(map);
  }

  static createAddCustomFields(input: any): Action {
    let map: OrderedMap<string, List<CustomField>> = OrderedMap<string, List<CustomField>>();
    if (input) {
      map = map.withMutations(mutable => {
        for (const key of Object.keys(input)) {
          mutable.set(key, this.createListFromInput(input, key));
        }
      });
    }

    return new AddCustomFieldsAction(map);
  }

  private static createListFromInput(input: any, key: string): List<CustomField> {
    const inputArray: any[] = input[key];
    const cfs: CustomField[] = new Array<CustomField>(inputArray.length);
    for (let i = 0 ; i < inputArray.length ; i++) {
      cfs[i] = CustomFieldUtil.fromJs(inputArray[i]);
    }
    return List<CustomField>(cfs);
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
    case ADD_CUSTOM_FIELDS: {
      const payload: Map<string, List<CustomField>> = (<AddCustomFieldsAction>action).payload;
      if (payload.size > 0) {
        const fields = state.fields.withMutations(mutableFields => {
          payload.forEach((list, key) => {
            const customFields: List<CustomField> = mutableFields.get(key).concat(list)
              .sort((a, b) => a.value.toLocaleLowerCase().localeCompare(b.value.toLocaleLowerCase())).toList();
            mutableFields.set(
                key,
                customFields);
          });
        });
        return CustomFieldUtil.toStateRecord(state).withMutations(mutable => {
          mutable.fields = fields;
        });
      }
      return state;
    }
    default:
      return state;
  }
};
