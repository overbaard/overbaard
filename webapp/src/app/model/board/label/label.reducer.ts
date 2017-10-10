import {Action} from '@ngrx/store';
import {List} from 'immutable';
import {initialLabelState, LabelState, LabelUtil} from './label.model';
import {AppState} from '../../../app-store';
import {createSelector} from 'reselect';


const DESERIALIZE_ALL_LABELS = 'DESERIALIZE_ALL_LABELS';
const ADD_LABELS = 'ADD_LABELS';

class DeserializeLabelsAction implements Action {
  readonly type = DESERIALIZE_ALL_LABELS;

  constructor(readonly payload: List<string>) {
  }
}


class AddLabelsAction implements Action {
  readonly type = ADD_LABELS;

  constructor(readonly payload: List<string>) {
  }
}

export class LabelActions {
  static createDeserializeLabels(input: any): Action {
    const inputArray: string[] = input ? input : [];
    return new DeserializeLabelsAction(List<string>(inputArray));
  }


  static createAddLabels(input: any): Action {
    const inputArray: string[] = input ? input : [];
    return new AddLabelsAction(List<string>(inputArray));
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
    case ADD_LABELS: {
      const payload: List<string> = (<AddLabelsAction>action).payload;
      if (payload.size > 0) {
        //
        // let newLabels: List<string> = state.labels.withMutations(mutable => {
        //   payload.forEach(v => mutable.push(v));
        // }).asImmutable();
        //
        // newLabels = newLabels.sort((a, b) => a.toLocaleLowerCase().localeCompare(b.toLocaleLowerCase()))
        //   .toList();

        const newLabels: List<string> = state.labels.concat(payload)
          .sort((a, b) => a.toLocaleLowerCase().localeCompare(b.toLocaleLowerCase()))
          .toList();
        return LabelUtil.toStateRecord(state).withMutations(mutable => {
          mutable.labels = newLabels;
        });
      }
      return state;
    }
    default:
      return state;
  }
};


const getLabelsState = (state: AppState) => state.board.labels;
const getLabels = (state: LabelState) => state.labels;
export const labelsSelector = createSelector(getLabelsState, getLabels);
