import {AppState} from '../../../app-store';
import {Action} from '@ngrx/store';
import {initialPriorityState, Priority, PriorityState, PriorityUtil} from './priority.model';
import {createSelector} from 'reselect';


const DESERIALIZE_ALL_PRIORITIES = 'DESERIALIZE_ALL_PRIORITIES';

class DeserializePrioritiesAction implements Action {
  readonly type = DESERIALIZE_ALL_PRIORITIES;

  constructor(readonly payload: Priority[]) {
  }
}

export class PriorityActions {
  static createDeserializePriorities(input: any): Action {
    const inputArray: any[] = input ? input : [];
    const priorities = new Array<Priority>(inputArray.length);
    inputArray.forEach((type, i) => {
      priorities[i] = PriorityUtil.fromJS(type);
    });

    return new DeserializePrioritiesAction(priorities);
  }
}

export function priorityReducer(state: PriorityState = initialPriorityState, action: Action): PriorityState {

  switch (action.type) {
    case DESERIALIZE_ALL_PRIORITIES: {
      const payload: Priority[] = (<DeserializePrioritiesAction>action).payload;
      let priorities = state.priorities;
      priorities = priorities.withMutations(mutable => {
        for (const type of payload) {
          mutable.set(type.name, type);
        }
      });
      const newState: PriorityState = PriorityUtil.toStateRecord(state).withMutations(mutable => {
        mutable.priorities = priorities;
      });
      if (PriorityUtil.toStateRecord(newState).equals(PriorityUtil.toStateRecord(state))) {
        return state;
      }
      return newState;
    }
    default:
      return state;
  }
};

const getPrioritiesState = (state: AppState) => state.board.priorities;
const getPriorities = (state: PriorityState) => state.priorities;
export const prioritiesSelector = createSelector(getPrioritiesState, getPriorities);
