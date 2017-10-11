import {Action} from '@ngrx/store';
import {List} from 'immutable';
import {ComponentState, ComponentUtil, initialComponentState} from './component.model';
import {AppState} from '../../../../app-store';
import {createSelector} from 'reselect';


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

export function componentReducer(state: ComponentState = initialComponentState, action: Action): ComponentState {

  switch (action.type) {
    case DESERIALIZE_ALL_COMPONENTS: {
      const payload: List<string> = (<DeserializeComponentsAction>action).payload;
      const newState: ComponentState = ComponentUtil.toStateRecord(state).withMutations(mutable => {
        mutable.components = payload;
      });
      if ((ComponentUtil.toStateRecord(newState)).equals(ComponentUtil.toStateRecord(state))) {
        return state;
      }
      return newState;
    }
    case ADD_COMPONENTS: {
      const payload: List<string> = (<AddComponentsAction>action).payload;
      if (payload.size > 0) {


        const newComponents: List<string> = state.components.concat(payload)
          .sort((a, b) => a.toLocaleLowerCase().localeCompare(b.toLocaleLowerCase()))
          .toList();

        return ComponentUtil.toStateRecord(state).withMutations(mutable => {
          mutable.components = newComponents;
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
