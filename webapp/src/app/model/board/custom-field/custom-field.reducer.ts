import {Action} from '@ngrx/store';
import {Map, OrderedMap} from 'immutable';
import {CustomField, CustomFieldState, CustomFieldUtil, initialCustomFieldState} from './custom-field.model';
import {AppState} from '../../../app-store';
import {createSelector} from 'reselect';


const DESERIALIZE_ALL_CUSTOM_FIELDS = 'DESERIALIZE_ALL_CUSTOM_FIELDS';
const ADD_CUSTOM_FIELDS = 'ADD_CUSTOM_FIELDS';

class DeserializeCustomFieldsAction implements Action {
  readonly type = DESERIALIZE_ALL_CUSTOM_FIELDS;

  constructor(readonly payload: OrderedMap<string, OrderedMap<string, CustomField>>) {
  }
}

class AddCustomFieldsAction implements Action {
  readonly type = ADD_CUSTOM_FIELDS;

  constructor(readonly payload: Map<string, OrderedMap<string, CustomField>>) {
  }
}

export class CustomFieldActions {
  static createDeserializeCustomFields(input: any): Action {
    const keys: string[] = Object.keys(input).sort((a, b) => a.toLocaleLowerCase().localeCompare(b.toLocaleLowerCase()));
    const map: OrderedMap<string, OrderedMap<string, CustomField>>
      = OrderedMap<string, OrderedMap<string, CustomField>>().withMutations(mutable => {
      for (const key of keys) {
        mutable.set(key, this.createMapFromInput(input, key));
      }
    });

    return new DeserializeCustomFieldsAction(map);
  }

  static createAddCustomFields(input: any): Action {
    let map: OrderedMap<string, OrderedMap<string, CustomField>> = OrderedMap<string, OrderedMap<string, CustomField>>();
    if (input) {
      map = map.withMutations(mutable => {
        for (const key of Object.keys(input)) {
          mutable.set(key, this.createMapFromInput(input, key));
        }
      });
    }

    return new AddCustomFieldsAction(map);
  }

  private static createMapFromInput(input: any, key: string): OrderedMap<string, CustomField> {
    const inputArray: any[] = input[key];
    return OrderedMap<string, CustomField>().withMutations(mutable => {
      for (let i = 0 ; i < inputArray.length ; i++) {
        const cf = CustomFieldUtil.fromJs(inputArray[i]);
        mutable.set(cf.key, cf);
      }
    });
  }
}

export function customFieldReducer(state: CustomFieldState = initialCustomFieldState, action: Action): CustomFieldState {

  switch (action.type) {
    case DESERIALIZE_ALL_CUSTOM_FIELDS: {
      const payload: OrderedMap<string, OrderedMap<string, CustomField>> = (<DeserializeCustomFieldsAction>action).payload;
      const newState = CustomFieldUtil.toStateRecord(state).withMutations(mutable => {
        mutable.fields = payload;
      });
      if ((CustomFieldUtil.toStateRecord(newState)).equals(CustomFieldUtil.toStateRecord(state))) {
        return state;
      }
      return newState;
    }
    case ADD_CUSTOM_FIELDS: {
      const payload: Map<string, OrderedMap<string, CustomField>> = (<AddCustomFieldsAction>action).payload;
      if (payload.size > 0) {
        const fields = state.fields.withMutations(mutableFields => {
          payload.forEach((map, key) => {
            const customFields: OrderedMap<string, CustomField> = mutableFields.get(key).concat(map)
              .sort((a, b) => a.value.toLocaleLowerCase().localeCompare(b.value.toLocaleLowerCase())).toOrderedMap();
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


const getCustomFieldsState = (state: AppState) => state.board.customFields;
const getCustomFields = (state: CustomFieldState) => state.fields;
export const customFieldsSelector = createSelector(getCustomFieldsState, getCustomFields);
