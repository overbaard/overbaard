import {Action} from '@ngrx/store';
import {List} from 'immutable';
import {ComponentState, ComponentStateModifier, ComponentStateRecord, initialComponentState} from './component.model';


const DESERIALIZE_ALL_COMPONENTS = 'DESERIALIZE_ALL_COMPONENTS';

class DeserializeComponentsAction implements Action {
  readonly type = DESERIALIZE_ALL_COMPONENTS;

  constructor(readonly payload: List<string>) {
  }
}

export class ComponentActions {
  static createDeserializeComponents(input: any): Action {
    const inputArray: string[] = input ? input : [];
    return new DeserializeComponentsAction(List<string>(inputArray));
  }
}

export function componentReducer(state: ComponentState = initialComponentState, action: Action): ComponentState {

  switch (action.type) {
    case DESERIALIZE_ALL_COMPONENTS: {
      const payload: List<string> = (<DeserializeComponentsAction>action).payload;
      const newState: ComponentState = ComponentStateModifier.update(state, copy => {
        copy.components = payload;
      });
      if ((<ComponentStateRecord>newState).equals(<ComponentStateRecord>state)) {
        return state;
      }
      return newState;
    }
    default:
      return state;
  }
};
