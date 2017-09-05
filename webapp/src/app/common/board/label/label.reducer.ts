import {Action} from '@ngrx/store';
import {List} from 'immutable';
import {LabelState, LabelUtil, initialLabelState} from './label.model';


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
      const newState: LabelState = LabelUtil.toStateRecord(state).withMutations(mutable => {
        mutable.labels = payload;
      });
      if ((LabelUtil.toStateRecord(newState)).equals(LabelUtil.toStateRecord(state))) {
        return state;
      }
      return newState;
    }
    default:
      return state;
  }
};
