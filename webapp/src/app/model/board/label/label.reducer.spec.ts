import {LabelActions, labelReducer} from './label.reducer';
import {initialLabelState, LabelState} from './label.model';
import {cloneObject} from '../../../common/object-util';

export function getTestLabelsInput(): any {
  return cloneObject(['L-10', 'L-20', 'L-30']);
}

export function getTestLabelState(): LabelState {
  const input: any = getTestLabelsInput();
  return labelReducer(initialLabelState, LabelActions.createDeserializeLabels(input));
}

describe('Label reducer tests', () => {
  it ('Deserialize', () => {
    it('Initial state', () => {
      const state: LabelState = getTestLabelState();
      expect(state.labels.toArray()).toEqual(['L-10', 'L-20', 'L-30']);
    });

    it ('Same', () => {
      const stateA: LabelState = getTestLabelState();
      const stateB: LabelState =
        labelReducer(stateA, LabelActions.createDeserializeLabels(getTestLabelsInput()));
      expect(stateA).toBe(stateB);
    });
  });

  it ('Changes', () => {
    it ('Add labels', () => {
      const state: LabelState = getTestLabelState();
      const newState: LabelState =
        labelReducer(state, LabelActions.createAddLabels(['l-05', 'L-14', 'l-13', 'L-25']));
      expect(newState.labels.toArray()).toEqual(['l-05', 'L-10', 'l-13', 'L-14', 'L-20', 'L-25', 'L-30']);
    });

    it ('No change', () => {
      const state: LabelState = getTestLabelState();
      const newState: LabelState =
        labelReducer(state, LabelActions.createAddLabels(null));
      expect(newState).toBe(state);
    });
  });
});


