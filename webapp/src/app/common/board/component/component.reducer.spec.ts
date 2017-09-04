import {ComponentActions, componentReducer} from './component.reducer';
import {ComponentState, initialComponentState} from './component.model';
import {List} from 'immutable';

export const COMPONENTS_INPUT = ['C-1', 'C-2', 'C-3'];
describe('Component reducer tests', () => {
  it('Deserialize initial state', () => {
    const state: ComponentState =
      componentReducer(initialComponentState, ComponentActions.createDeserializeComponents(COMPONENTS_INPUT));
    expect(state.components).toEqual(List<string>(['C-1', 'C-2', 'C-3']));
  });

  it ('Deserialize same state', () => {
    const stateA: ComponentState =
      componentReducer(initialComponentState, ComponentActions.createDeserializeComponents(COMPONENTS_INPUT));
    const stateB: ComponentState =
      componentReducer(stateA, ComponentActions.createDeserializeComponents(COMPONENTS_INPUT));
    expect(stateA).toBe(stateB);
  });
});


