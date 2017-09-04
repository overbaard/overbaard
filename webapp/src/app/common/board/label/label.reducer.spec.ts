import {LabelActions, labelReducer} from './label.reducer';
import {LabelState, initialLabelState} from './label.model';
import {List} from 'immutable';

export const LABELS_INPUT = ['L-1', 'L-2', 'L-3'];
describe('Label reducer tests', () => {
  it('Deserialize initial state', () => {
    const state: LabelState =
      labelReducer(initialLabelState, LabelActions.createDeserializeLabels(LABELS_INPUT));
    expect(state.labels).toEqual(List<string>(['L-1', 'L-2', 'L-3']));
  });

  it ('Deserialize same state', () => {
    const stateA: LabelState =
      labelReducer(initialLabelState, LabelActions.createDeserializeLabels(LABELS_INPUT));
    const stateB: LabelState =
      labelReducer(stateA, LabelActions.createDeserializeLabels(LABELS_INPUT));
    expect(stateA).toBe(stateB);
  });
});


