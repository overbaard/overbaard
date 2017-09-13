import {ComponentActions, componentReducer} from './component.reducer';
import {ComponentState, initialComponentState} from './component.model';
import {cloneObject} from '../../utils/test-util.spec';

export function getTestComponentsInput() {
  return cloneObject(['C-10', 'C-20', 'C-30']);
}
describe('Component reducer tests', () => {

  describe('Deserialize', () => {

    it('Initial state', () => {
      const state: ComponentState =
        componentReducer(initialComponentState, ComponentActions.createDeserializeComponents(getTestComponentsInput()));
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
      /**
       {
                        Tester: [{key: "stuart", value: "Stuart Douglas"}],
                        Documenter: [{key: "brian", value: "Brian Stansberry"}]
                    }
       */
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


