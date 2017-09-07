import {LabelActions, labelReducer} from './label.reducer';
import {LabelState, initialLabelState} from './label.model';
import {List} from 'immutable';
import {cloneObject} from '../../utils/test-util.spec';

export function getTestLabelsInput(): any {
  return cloneObject(['L-1', 'L-2', 'L-3']);
}
describe('Label reducer tests', () => {
  it('Deserialize initial state', () => {
    const state: LabelState =
      labelReducer(initialLabelState, LabelActions.createDeserializeLabels(getTestLabelsInput()));
    expect(state.labels).toEqual(List<string>(['L-1', 'L-2', 'L-3']));
  });

  it ('Deserialize same state', () => {
    const stateA: LabelState =
      labelReducer(initialLabelState, LabelActions.createDeserializeLabels(getTestLabelsInput()));
    const stateB: LabelState =
      labelReducer(stateA, LabelActions.createDeserializeLabels(getTestLabelsInput()));
    expect(stateA).toBe(stateB);
  });

  it ('Deserialize same state', () => {
    const stateA: LabelState =
      labelReducer(initialLabelState, LabelActions.createDeserializeLabels(getTestLabelsInput()));
    const stateB: LabelState =
      labelReducer(stateA, LabelActions.createDeserializeLabels(getTestLabelsInput()));
    expect(stateA).toBe(stateB);
  });
});


