import {Action, createSelector} from '@ngrx/store';
import {List} from 'immutable';
import {ComponentState, ComponentUtil, initialComponentState} from './component.model';
import {AppState} from '../../../../app-store';


const DESERIALIZE_ALL_COMPONENTS = 'DESERIALIZE_ALL_COMPONENTS';
const ADD_COMPONENTS = 'ADD_COMPONENTS';

class DeserializeComponentsAction implements Action {
  readonly type = DESERIALIZE_ALL_COMPONENTS;

  constructor(readonly payload: List<string>) {
  }
}

class AddComponentsAction implements Action {
  readonly type = ADD_COMPONENTS;

  constructor(readonly payload: List<string>) {
  }
}

export class ComponentActions {
  static createDeserializeComponents(input: any): Action {
    const inputArray: string[] = input ? input : [];
    return new DeserializeComponentsAction(List<string>(inputArray));
  }

  static createAddComponents(input: any): Action {
    const inputArray: string[] = input ? input : [];
    return new AddComponentsAction(List<string>(inputArray));
  }
}

// 'meta-reducer here means it is not called directly by the store, rather from the boardReducer
export function componentMetaReducer(state: ComponentState = initialComponentState, action: Action): ComponentState {

  switch (action.type) {
    case DESERIALIZE_ALL_COMPONENTS: {
      const payload: List<string> = (<DeserializeComponentsAction>action).payload;
      return ComponentUtil.withMutations(state, mutable => {
        if (!payload.equals(mutable.components)) {
          mutable.components = payload;
        }
      });
    }
    case ADD_COMPONENTS: {
      const payload: List<string> = (<AddComponentsAction>action).payload;
      if (payload.size > 0) {
        const newComponents: List<string> = state.components.concat(payload)
          .sort((a, b) => a.toLocaleLowerCase().localeCompare(b.toLocaleLowerCase()))
          .toList();

        return ComponentUtil.withMutations(state, mutable => {
          if (!payload.equals(mutable.components)) {
            mutable.components = newComponents;
          }
        });
      }
      return state;
    }
    default:
      return state;
  }
};

const getComponentsState = (state: AppState) => state.board.components;
const getComponents = (state: ComponentState) => state.components;
export const componentsSelector = createSelector(getComponentsState, getComponents);
