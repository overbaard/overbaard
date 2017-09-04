import {ComponentActions, componentReducer} from './component.reducer';
import {ComponentState, initialComponentState} from './component.model';
import {List} from 'immutable';

describe('Component reducer tests', () => {
  it('Deserialize initial state', () => {
    const state: ComponentState =
      componentReducer(initialComponentState, ComponentActions.createDeserializeComponents(['One', 'Two']));
    expect(state.components).toEqual(List<string>(['One', 'Two']));
  });

  it ('Deserialize same state', () => {
    const stateA: ComponentState =
      componentReducer(initialComponentState, ComponentActions.createDeserializeComponents(['One', 'Two']));
    const stateB: ComponentState =
      componentReducer(stateA, ComponentActions.createDeserializeComponents(['One', 'Two']));
    expect(stateA).toBe(stateB);
  });
});


