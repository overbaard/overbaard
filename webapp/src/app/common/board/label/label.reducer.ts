import {Action} from '@ngrx/store';
import {List} from 'immutable';
import {LabelState, LabelStateModifier, LabelStateRecord, initialLabelState} from './label.model';


const DESERIALIZE_ALL_LABELS = 'DESERIALIZE_ALL_LABELS';

class DeserializeLabelsAction implements Action {
  readonly type = DESERIALIZE_ALL_LABELS;

  constructor(readonly payload: List<string>) {
  }
}

export class LabelActions {
  static createDeserializeLabels(input: any): Action {
    const inputArray: string[] = input ? input : [];
    return new DeserializeLabelsAction(List<string>(inputArray));
  }
}

export function labelReducer(state: LabelState = initialLabelState, action: Action): LabelState {

  switch (action.type) {
    case DESERIALIZE_ALL_LABELS: {
      const payload: List<string> = (<DeserializeLabelsAction>action).payload;
      const newState: LabelState = LabelStateModifier.update(state, copy => {
        copy.labels = payload;
      });
      if ((<LabelStateRecord>newState).equals(<LabelStateRecord>state)) {
        return state;
      }
      return newState;
    }
    default:
      return state;
  }
};
