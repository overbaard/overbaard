import {ComponentActions, componentReducer} from './component.reducer';
import {ComponentState, initialComponentState} from './component.model';
import {cloneObject} from '../../../common/object-util';

export function getTestComponentsInput(): any {
  return cloneObject(['C-10', 'C-20', 'C-30']);
}
export function getTestComponentState(): ComponentState {
  const input: any = getTestComponentsInput();
  return componentReducer(initialComponentState, ComponentActions.createDeserializeComponents(input));
}

describe('Component reducer tests', () => {

  describe('Deserialize', () => {

    it('Initial state', () => {
      const state: ComponentState = getTestComponentState();
      expect(state.components.toArray()).toEqual(['C-10', 'C-20', 'C-30']);
    });

    it ('Same state', () => {
      const stateA: ComponentState =
        componentReducer(initialComponentState, ComponentActions.createDeserializeComponents(getTestComponentsInput()));
      const stateB: ComponentState =
        componentReducer(stateA, ComponentActions.createDeserializeComponents(getTestComponentsInput()));
      expect(stateA).toBe(stateB);
    });
  });

  describe('Changes', () => {
    it ('Add components', () => {
      const state: ComponentState =
        componentReducer(initialComponentState, ComponentActions.createDeserializeComponents(getTestComponentsInput()));
      const newState: ComponentState =
        componentReducer(state, ComponentActions.createAddComponents(['c-05', 'C-14', 'c-13', 'C-25']));
      expect(newState.components.toArray()).toEqual(['c-05', 'C-10', 'c-13', 'C-14', 'C-20', 'C-25', 'C-30']);
    });

    it ('No change', () => {
      const state: ComponentState =
        componentReducer(initialComponentState, ComponentActions.createDeserializeComponents(getTestComponentsInput()));
      const newState: ComponentState =
        componentReducer(state, ComponentActions.createAddComponents(null));
      expect(newState).toBe(state);
    });
  });
});


