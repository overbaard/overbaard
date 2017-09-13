import {LabelActions, labelReducer} from './label.reducer';
import {LabelState, initialLabelState} from './label.model';
import {cloneObject} from '../../utils/test-util.spec';

export function getTestLabelsInput(): any {
  return cloneObject(['L-10', 'L-20', 'L-30']);
}
describe('Label reducer tests', () => {
  it ('Deserialize', () => {
    it('Initial state', () => {
      const state: LabelState =
        labelReducer(initialLabelState, LabelActions.createDeserializeLabels(getTestLabelsInput()));
      expect(state.labels.toArray()).toEqual(['L-10', 'L-20', 'L-30']);
    });

    it ('Same', () => {
      const stateA: LabelState =
        labelReducer(initialLabelState, LabelActions.createDeserializeLabels(getTestLabelsInput()));
      const stateB: LabelState =
        labelReducer(stateA, LabelActions.createDeserializeLabels(getTestLabelsInput()));
      expect(stateA).toBe(stateB);
    });
  });

  it ('Changes', () => {
    it ('Add labels', () => {
      const state: LabelState =
        labelReducer(initialLabelState, LabelActions.createDeserializeLabels(getTestLabelsInput()));
      const newState: LabelState =
        labelReducer(state, LabelActions.createAddLabels(['l-05', 'L-14', 'l-13', 'L-25']));
      expect(newState.labels.toArray()).toEqual(['l-05', 'L-10', 'l-13', 'L-14', 'L-20', 'L-25', 'L-30']);
    });

    it ('No change', () => {
      const state: LabelState =
        labelReducer(initialLabelState, LabelActions.createDeserializeLabels(getTestLabelsInput()));
      const newState: LabelState =
        labelReducer(state, LabelActions.createAddLabels(null));
      expect(newState).toBe(state);
    });
  });
});


