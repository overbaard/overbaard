import {Action, createSelector} from '@ngrx/store';
import {Map, OrderedMap} from 'immutable';
import {CustomFieldValue, CustomFieldState, CustomFieldUtil, initialCustomFieldState, CustomFieldData} from './custom-field.model';
import {AppState} from '../../../../app-store';


const DESERIALIZE_ALL_CUSTOM_FIELDS = 'DESERIALIZE_ALL_CUSTOM_FIELDS';
const ADD_CUSTOM_FIELDS = 'ADD_CUSTOM_FIELDS';

class DeserializeCustomFieldsAction implements Action {
  readonly type = DESERIALIZE_ALL_CUSTOM_FIELDS;

  constructor(readonly payload: OrderedMap<string, CustomFieldData>) {
  }
}

class AddCustomFieldsAction implements Action {
  readonly type = ADD_CUSTOM_FIELDS;

  constructor(readonly payload: Map<string, OrderedMap<string, CustomFieldValue>>) {
  }
}

export class CustomFieldActions {
  static createDeserializeCustomFields(input: any): Action {
    const keys: string[] = Object.keys(input).sort((a, b) => a.toLocaleLowerCase().localeCompare(b.toLocaleLowerCase()));
    const map: OrderedMap<string, CustomFieldData> = OrderedMap<string, CustomFieldData>()
      .withMutations(mutable => {
        for (const key of keys) {
          const values: OrderedMap<string, CustomFieldValue> = this.createMapFromInput(input[key]['values']);
          const data: CustomFieldData = CustomFieldUtil.createCustomFieldData(input[key]['type'], values);
          mutable.set(key, data);
        }
    });

    return new DeserializeCustomFieldsAction(map);
  }

  static createAddCustomFields(input: any): Action {
    let map: OrderedMap<string, OrderedMap<string, CustomFieldValue>> = OrderedMap<string, OrderedMap<string, CustomFieldValue>>();
    if (input) {
      map = map.withMutations(mutable => {
        for (const key of Object.keys(input)) {
          mutable.set(key, this.createMapFromInput(input[key]));
        }
      });
    }

    return new AddCustomFieldsAction(map);
  }

  private static createMapFromInput(input: any[]): OrderedMap<string, CustomFieldValue> {
    return OrderedMap<string, CustomFieldValue>().withMutations(mutable => {
      for (let i = 0 ; i < input.length ; i++) {
        const cf = CustomFieldUtil.fieldFromJs(input[i]);
        mutable.set(cf.key, cf);
      }
    });
  }
}

// 'meta-reducer here means it is not called directly by the store, rather from the boardReducer
export function customFieldMetaReducer(state: CustomFieldState = initialCustomFieldState, action: Action): CustomFieldState {

  switch (action.type) {
    case DESERIALIZE_ALL_CUSTOM_FIELDS: {
      const payload: OrderedMap<string, CustomFieldData> = (<DeserializeCustomFieldsAction>action).payload;
      const newState = CustomFieldUtil.withMutations(state, mutable => {
        if (!mutable.fields.equals(payload)) {
          mutable.fields = payload;
        }
      });
      return newState;
    }
    case ADD_CUSTOM_FIELDS: {
      const payload: Map<string, OrderedMap<string, CustomFieldValue>> = (<AddCustomFieldsAction>action).payload;
      if (payload.size > 0) {
        const fieldDatas = state.fields.withMutations(mutableFieldDatas => {
          payload.forEach((map, key) => {
            const customFields: OrderedMap<string, CustomFieldValue> = mutableFieldDatas.get(key).fieldValues.concat(map)
              .sort((a, b) => a.value.toLocaleLowerCase().localeCompare(b.value.toLocaleLowerCase())).toOrderedMap();
            mutableFieldDatas.set(
                key,
                CustomFieldUtil.updateCustomFieldValues(mutableFieldDatas.get(key), customFields));
          });
        });
        return CustomFieldUtil.withMutations(state, mutable => {
          mutable.fields = fieldDatas;
        });
      }
      return state;
    }
    default:
      return state;
  }
}


const getCustomFieldsState = (state: AppState) => state.board.customFields;
const getCustomFields = (state: CustomFieldState) => state.fields;
export const customFieldsSelector = createSelector(getCustomFieldsState, getCustomFields);
