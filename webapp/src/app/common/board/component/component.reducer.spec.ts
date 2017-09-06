import {ComponentActions, componentReducer} from './component.reducer';
import {ComponentState, initialComponentState} from './component.model';
import {List} from 'immutable';
import {cloneObject} from '../../utils/test-util.spec';

export function getTestComponentsInput() {
  return cloneObject(['C-1', 'C-2', 'C-3']);
}
describe('Component reducer tests', () => {
  it('Deserialize initial state', () => {
    const state: ComponentState =
      componentReducer(initialComponentState, ComponentActions.createDeserializeComponents(getTestComponentsInput()));
    expect(state.components).toEqual(List<string>(['C-1', 'C-2', 'C-3']));
  });

  it ('Deserialize same state', () => {
    const stateA: ComponentState =
      componentReducer(initialComponentState, ComponentActions.createDeserializeComponents(getTestComponentsInput()));
    const stateB: ComponentState =
      componentReducer(stateA, ComponentActions.createDeserializeComponents(getTestComponentsInput()));
    expect(stateA).toBe(stateB);
  });
});


