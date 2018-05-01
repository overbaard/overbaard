import {AppState} from '../../../../app-store';
import {Action, createSelector} from '@ngrx/store';
import {initialPriorityState, Priority, PriorityState, PriorityUtil} from './priority.model';


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

// 'meta-reducer here means it is not called directly by the store, rather from the boardReducer
export function priorityMetaReducer(state: PriorityState = initialPriorityState, action: Action): PriorityState {

  switch (action.type) {
    case DESERIALIZE_ALL_PRIORITIES: {
      const payload: Priority[] = (<DeserializePrioritiesAction>action).payload;
      let priorities = state.priorities;
      priorities = priorities.withMutations(mutable => {
        for (const type of payload) {
          mutable.set(type.name, type);
        }
      });
      return PriorityUtil.withMutations(state, mutable => {
        if (!mutable.priorities.equals(priorities)) {
          mutable.priorities = priorities;
        }
      });
    }
    default:
      return state;
  }
}

const getPrioritiesState = (state: AppState) => state.board.priorities;
const getPriorities = (state: PriorityState) => state.priorities;
export const prioritiesSelector = createSelector(getPrioritiesState, getPriorities);
