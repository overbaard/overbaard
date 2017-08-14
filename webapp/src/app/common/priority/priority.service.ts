import {Injectable} from '@angular/core';
import {AppState} from '../../app-store';
import {Action, Store} from '@ngrx/store';
import {Priority, PriorityFactory} from './priority.model';
import * as Immutable from 'immutable';
import {createSelector} from 'reselect';
import {Observable} from 'rxjs/Observable';


const DESERIALIZE_ALL_PRIORITIES = 'DESERIALIZE_ALL_PRIORITIES';

class DeserializePrioritiesAction implements Action {
  readonly type = DESERIALIZE_ALL_PRIORITIES;

  constructor(readonly payload: Priority[]) {
  }
}

export interface PriorityState {
  priorities: Immutable.OrderedMap<string, Priority>;
}

const initialState = {
  priorities: Immutable.OrderedMap<string, Priority>()
};

export function reducer(state: PriorityState = initialState, action: Action): PriorityState {

  switch (action.type) {
    case DESERIALIZE_ALL_PRIORITIES: {
      const payload: Priority[] = (<DeserializePrioritiesAction>action).payload;
      let priorities = state.priorities;
      priorities = priorities.withMutations(mutable => {
        for (const type of payload) {
          mutable.set(type.name, type);
        }
      });
      return {
        priorities: priorities
      };
    }
    default:
      return state;
  }
};

const getPrioritiesState = (state: AppState) => state.priorities;
const getPriorities = (state: PriorityState) => state.priorities;
export const prioritiesSelector = createSelector(getPrioritiesState, getPriorities);


@Injectable()
export class PriorityService {

  constructor(private store: Store<AppState>) {
  }

  getPriorities(): Observable<Immutable.OrderedMap<string, Priority>> {
    return this.store.select(prioritiesSelector);
  }

  deserializePriorities(input: any) {
    const inputArray: any[] = input ? input : [];
    const priorities = new Array<Priority>(inputArray.length);
    inputArray.forEach((type, i) => {
      priorities[i] = PriorityFactory.fromJS(type);
    });


    this.store.dispatch(new DeserializePrioritiesAction(priorities));
  }
}

